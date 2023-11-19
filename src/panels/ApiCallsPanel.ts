/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { XmlUtil } from "../utilities/xmlutil";
import { Connection, ConnectionUtils } from "../utilities/connection";
import axios from "axios";
import * as cheerio from "cheerio";
const css = require(".././media/style.css");
const ttf = require(".././media/codicon.ttf");
const codicon = require(".././media/codicon.css");


export class ApiCallsPanel {
  public static currentPanel: ApiCallsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private readonly _wwsUri= "https://community.workday.com/sites/default/files/file-hosting/productionapi/";
  private readonly _wwsUrl = this._wwsUri + "index.html";  
  private readonly _connection: Connection;
  private _secrets: vscode.SecretStorage | undefined;   
  private static _xml: string = "";
  private static _tabLabel: string = "";
  private _statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._connection = new Connection();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, context.extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._secrets = context.secrets;
    vscode.window.onDidChangeActiveTextEditor(this._onDidChangeActiveTextEditor, this, this._disposables);
  }

  public static render(context: vscode.ExtensionContext) {
    let activeLabel = "";
    if (vscode.window.tabGroups.activeTabGroup.activeTab) {
      activeLabel = vscode.window.tabGroups.activeTabGroup.activeTab.label;
    }
    if (ApiCallsPanel.currentPanel) {
      ApiCallsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
      if (activeLabel !== ApiCallsPanel._tabLabel) {
        vscode.window.showInformationMessage("Change Current Document on API Calls page?", "Yes", "No")
        .then(answer => {
          if (answer === "Yes") {  
            ApiCallsPanel._tabLabel = activeLabel;            
            ApiCallsPanel.currentPanel?._panel.webview.postMessage({ command: 'documentChanged', document: ApiCallsPanel._tabLabel });
            // Save the text from the active editor.
            if (vscode.window.activeTextEditor) {
              this._xml = vscode.window.activeTextEditor.document.getText();
            }
          }
        });
      } 
      else {
        // Save the text from the active editor.
        if (vscode.window.activeTextEditor) {
          this._xml = vscode.window.activeTextEditor.document.getText();
        }
      }     
    } else {
      // Save the text from the active editor.
      if (vscode.window.activeTextEditor) {
        this._xml = vscode.window.activeTextEditor.document.getText();
      }
      // Save the label from the active editor.
      if (vscode.window.tabGroups.activeTabGroup.activeTab) {
        this._tabLabel = vscode.window.tabGroups.activeTabGroup.activeTab.label;
      }
      const panel = vscode.window.createWebviewPanel("erp-helper", "API Calls (ERP Helper)", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')]
      });
      ApiCallsPanel.currentPanel = new ApiCallsPanel(panel, context);
    } 
  }

  public dispose() {
    ApiCallsPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _onDidChangeActiveTextEditor() {
    if (vscode.window.activeTextEditor) {
      if (vscode.window.tabGroups.activeTabGroup.activeTab) {
        //ApiCallsPanel._tabLabel = vscode.window.tabGroups.activeTabGroup.activeTab.label; 
      }
    }
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text; 
        switch (command) {
          case "formLoad":
            await this._formLoad();
            return;
          case "formLoadWebServices":
            await this._formLoadWebServices();
            return;
          case "txtVersionLoad":
            const version = await vscode.workspace.getConfiguration().get('erp-helper.apiVersionSaved');
            if (this._panel) {
              this._panel.webview.postMessage({ command: 'txtVersionLoad', message: version });
            }
            return;            
          case "drpConnectionOnChange":
            await this._drpConnectionOnChange(text);
            return;
          case "drpWebServiceOnChange":
            await this._drpWebServiceOnChange(text);
            return;
          case "txtVersionOnChange":
            await vscode.workspace.getConfiguration().update('erp-helper.apiVersionSaved', text, true);
            return;            
          case "btnCallApiOnClick":
            await this._btnCallApiOnClick(message.data);
            return;
          case "lnkConnectionsOnClick":
            vscode.commands.executeCommand("erp-helper.connections");
            return;
          case "lnkWebServicesOnClick":
            vscode.commands.executeCommand("erp-helper.web-services");
            return;
          case "lnkGetWorkersOnClick":
            this._lnkGetWorkersOnClick();
            return;
        }
      },
      undefined,
      this._disposables
    );    
  }

  private async _formLoad() {
    const connections = await ConnectionUtils.connectionList();
    const connectionSelected = await ConnectionUtils.connectionSelected();
    
    const names =  connections.map(connection => { 
      let selected = "N";
      if (connectionSelected === connection.name) {
        selected = "Y";
      }
      return connection.name + "|" + selected; 
    }).join('\n');

    if (names.length > 0) {
      this._panel.webview.postMessage({ command: 'formLoad', message: names });
      this._panel.webview.postMessage({ command: 'documentChanged', document: ApiCallsPanel._tabLabel });
    }
  }

  private async _formLoadWebServices() {
    try {
      this._statusBarItem.text = `$(loading~spin) Loading`;
		  this._statusBarItem.show();
      const setting = await vscode.workspace.getConfiguration().get('erp-helper.webServiceSelected');
      const webSvcResponse = await axios.get(this._wwsUrl);
      const html = webSvcResponse.data;
      // Use Cheerio to parse the HTML
      const $ = cheerio.load(html);
      const links = $("a");
      // Loop through the selected elements
      let message = "";
      links.each((index, value) => {
        const i = index;
        const href = $(value).attr("href");              
        if (href) {
          if ( href.indexOf(".xsd") > 0) {
            const text = href.substring(href.lastIndexOf("/") + 1).replace(".xsd", "");
            const value = this._wwsUri + href;
            let selected = "N";
            if (setting === value) {
              selected = "Y";
            }
            message += text + "|" + value + "|" + selected + "\n";
          }
        }
      });
      if (this._panel) {
        this._panel.webview.postMessage({ command: 'formLoadWebServices', message: message });
      }
    }
    catch(ex) {
        vscode.window.showErrorMessage("Unexpected Error: " + ex);
        return;
    }
    finally {
		  this._statusBarItem.hide();
    }
  }

  private async _btnCallApiOnClick(api: any) {
    try {
      await this.xmlRefresh(api);
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
  
    return;
  }

  private async soapCall(api: any) {
    try {
      const conn = await ConnectionUtils.currentConnection(this._context);
      this._statusBarItem.text = `$(loading~spin) Processing`;
		  this._statusBarItem.show();
      const xmlUtil = new XmlUtil();
      // Remove an existing XML declaration.
      var xml = ApiCallsPanel._xml; 
      xml = xmlUtil.declarationRemove(xml);
      // Extract the request from an existing SOAP body.     
      let xmlLC = xml.toLowerCase();
      let bodyEnd = xmlLC.lastIndexOf(":body");
      if (bodyEnd > 0) {
        xml = xml.substring(0, bodyEnd);
        bodyEnd = xml.lastIndexOf("<");
        xml = xml.substring(0, bodyEnd);
        let bodyStart = xmlLC.indexOf(":body");
        bodyStart = xml.indexOf(">", bodyStart);
        xml = xml.substring(++bodyStart);
      } 
      // Wrap the request in a SOAP envelope.
      xml = XmlUtil.soapStart + xml + XmlUtil.soapEnd;
      if (api) {
        let url = api.url + api.service + "/" + api.version;
        let headers = {};
        let config = {};
        if (!conn.accessToken) {
          let xmlSecurity = XmlUtil.soapSecurity;          
          xmlSecurity = xmlSecurity.replace("{username}", api.username + "@" + api.tenant);
          xmlSecurity = xmlSecurity.replace("{password}", api.password);
          xml = xml.replace("{security}", xmlSecurity);
          headers = {
            'user-agent': 'erp-helper',
            'Content-Type': 'text/xml',
          };
          config =  {
            auth: {
              username: api.username + "@" + api.tenant,
              password: api.password
            },
            headers
          };
        } else {
          xml = xml.replace("{security}", '');
          headers = {
            'user-agent': 'erp-helper',
            'Content-Type': 'text/xml', 
            'X-Originator': 'erp-helper',
            'X-Tenant': conn.tenant,           
            'Authorization': 'Bearer ' + conn.accessToken 
          };
          config = {
            headers
          };
        }
        
        axios.post(
          url,
          xml,
          config,
        ).then(async (response) => {
          const xml = response.data;
          var result = await xmlUtil.transform(xml, XmlUtil.xsltTidy); 
          var option = {content: result, language: "xml"};
          await vscode.workspace.openTextDocument(option)
          .then((doc: vscode.TextDocument) => {
              vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false); 
          });
        }).catch((ex) => {
          let error = ex;
          if (ex.response) {
            error = ex.response.data;
          }
          vscode.window.showErrorMessage("Soap Fail: " + error );
        });        
      }
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
    finally {
		  this._statusBarItem.hide();
    }
  }

  private async xmlRefresh(api: any) {
    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    const label = activeTabGroup.activeTab?.label;
    if (activeTabGroup) {
      let found = false;
      activeTabGroup.tabs.forEach( async item => {
        var tab = item as vscode.Tab;
        if (tab.label === ApiCallsPanel._tabLabel) {
            found = true;
            const input  = (tab.input as vscode.TabInputText);
            await vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false })
              .then(editor => {
                ApiCallsPanel._xml = editor.document.getText();
                this.soapCall(api);
              });
            if (ApiCallsPanel.currentPanel) {
              ApiCallsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            }
        }
      });
      if (!found) {
        throw new Error("Current Document not found.");
      }
    }
    else {
      throw new Error("No active tab groups.");
    }
  }

  private async _drpConnectionOnChange(text : string) {
    try {
      this._statusBarItem.text = `$(loading~spin) Processing`;
		  this._statusBarItem.show();
      const conns = await ConnectionUtils.connectionList();
      const conn = conns.filter(item => item.name === text);
      if (conn.length === 0) {
        throw new Error("No connections found for " + text);
      }
      if (conn.length === 1) {
          conn[0].password = await ConnectionUtils.passwordGet(this._context, text);
          conn[0].accessToken = await ConnectionUtils.accessTokenGet(this._context, text);
          this._panel.webview.postMessage({ command: 'drpConnectionOnChange', message: conn[0] });              
      }
      else {
        throw new Error("More than one connection found for " + text);
      }
      return;
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
    finally {
		  this._statusBarItem.hide();
    }
  }

  private async _drpWebServiceOnChange(text : string) {
    try {
      await vscode.workspace.getConfiguration().update('erp-helper.webServiceSelected', text, true);
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
  }

  private async _lnkGetWorkersOnClick() {
    const xml = XmlUtil.getWorkersSample;
    var option = {content: xml, language: "xml"};
    await vscode.workspace.openTextDocument(option)
    .then((doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false); 
    });
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["dist", "apicalls.js"]);
    const styleUri = getUri(webview, extensionUri, ["dist", "style.css"]);
    const codiconsUri = getUri(webview, extensionUri, ["dist", "codicon.css"]);
  
    const nonce = getNonce();
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" href="${styleUri}">
          <link href="${codiconsUri}" rel="stylesheet" />
          <title>ERP Helper</title>
        </head>
        <body>
          <h1>API Request from a Document</h1>
          <div>
          <ol>
            <li>Configure a tenant connection on ERP Helper's <vscode-link id="lnkConnections">Connections</vscode-link> page.</li>
            <li>Create an XML request document (two helper resources are available below).</li>
              <ul>
                <li>ERP Helper's <vscode-link id="lnkWebServices">Web Services</vscode-link> page.</li>
                <li><vscode-link id="lnkGetWorkers">Get Workers</vscode-link> example.</li>
              </ul>            
            <li>In the request document, right-click/control-click and select <i>ERP Helper</i> > <i>API Calls.</i></li>
          </ol>
          </div>
          <br/>
          <strong>Current Document:</strong> <span id="spnDocument"></span>
          <br/>
          <br/>
          <vscode-divider></vscode-divider>
          <br/>
          <div class="dropdown-container">
            <label for="drpConnection">Connection</label><br/>
            <vscode-dropdown id="drpConnection" />
          </div>
          <vscode-button id="btnHide" appearance="icon">
            <span class="codicon codicon-chevron-up"></span>
          </vscode-button>
          <vscode-button id="btnShow" appearance="icon" hidden>
            <span class="codicon codicon-chevron-down"></span>
          </vscode-button>
          <vscode-divider></vscode-divider>
          <div id="connDetails">
            <div class="container">
              <div class="left">
                <div class="textfield-container">
                  <label for="txtTenant"><u>Tenant</u></label><br/>
                  <span id="spnTenant"></span>
                </div>
              </div>
              <div class="right">
                <div class="textfield-container">
                  <label for="txtUsername"><u>Username</u></label><br/>
                  <span id="spnUsername"></span>
                </div>
              </div>
            </div>
            <vscode-link id="lnkUrl" href=""></vscode-link>
            <br/>
            <vscode-divider></vscode-divider>
          </div>
          <br/>
          <div class="dropdown-container">
            <label for="drpWebService">Service</label><br/>
            <vscode-dropdown id="drpWebService"/>
          </div>
          <br/>
          <vscode-text-field placeholder="v40.2" type="text" id="txtVersion" name="txtVersion" value="v40.2">Version</vscode-text-field>
          <br/>
          <input type="hidden" id="txtTenant"/>
          <input type="hidden" id="txtUrl"/>
          <input type="hidden" id="txtUsername"/>
          <input type="hidden" id="txtPassword"/>
          <br/><br/>
          <vscode-button id="btnCallApi">Call API</vscode-button>
          <br/>
          <br/>
          <br/>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

}