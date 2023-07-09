/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { Soap } from "../utilities/soap";
import axios from "axios";
import * as cheerio from "cheerio";


export class ApiCallsPanel {
  public static currentPanel: ApiCallsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _wwsUri= "https://community.workday.com/sites/default/files/file-hosting/productionapi/";
  private readonly _wwsUrl = this._wwsUri + "index.html";  
  private readonly _connection = { name: "", url: "", tenant: "", username: "", password: "" };
  private _secrets: vscode.SecretStorage | undefined;   
  private static _xml: string = "";
  private static _tabLabel: string = "";

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, secrets: vscode.SecretStorage) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._secrets = secrets;
  }

  public static render(extensionUri: vscode.Uri, secrets: vscode.SecretStorage) {
    if (vscode.window.activeTextEditor) {
      this._xml = vscode.window.activeTextEditor.document.getText();
    }
    if (vscode.window.tabGroups.activeTabGroup.activeTab) {
      this._tabLabel = vscode.window.tabGroups.activeTabGroup.activeTab?.label;
    }
    if (ApiCallsPanel.currentPanel) {
      ApiCallsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("erp-helper", "API Calls", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });

      ApiCallsPanel.currentPanel = new ApiCallsPanel(panel, extensionUri, secrets);
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
            case "drpConnectionOnChange":
              await this._drpConnectionOnChange(text);
              return;
          case "drpWebServiceOnChange":
            await this._drpWebServiceOnChange(text);
            return;
          case "btnCallApiOnClick":
            await this._btnCallApiOnClick(message.data);
            return;
        }
      },
      undefined,
      this._disposables
    );    
  }

  private async _formLoad() {
    const connections = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
    const connectionSelected = await vscode.workspace.getConfiguration().get('erp-helper.connectionSelected');
    
    const names =  connections.map(connection => { 
      let selected = "N";
      if (connectionSelected === connection.name) {
        selected = "Y";
      }
      return connection.name + "|" + selected; 
    }).join('\n');

    if (names.length > 0) {
      this._panel.webview.postMessage({ command: 'formLoad', message: names });
    }
  }

  private async _formLoadWebServices() {
    try {
      const setting = await vscode.workspace.getConfiguration().get('erp-helper.webServiceSelected');
      const webSvcResponse = await axios.get(this._wwsUrl);
      const html = webSvcResponse.data;
      // Use Cheerio to parse the HTML
      const $ = cheerio.load(html);
      const links = $("a");
      // Loop through the selected elements
      let message = "";
      links.each((index, value) => {
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
      var xml = ApiCallsPanel._xml; 
      const declIndex = xml.indexOf("?>");
      if (declIndex > 0) {
        xml = xml.substring(declIndex + 2);
      }     
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
      xml = Soap.soapHeader + xml + Soap.soapFooter;
      xml = xml.replace("{username}", api.username + "@" + api.tenant);
      xml = xml.replace("{password}", api.password);

      if (api) {
        let url = api.url + api.service + "/" + api.version;
        const headers = {
          'user-agent': 'erp-helper',
          'Content-Type': 'text/xml',
        };
        axios.post(
          url,
          xml,
          {
            auth: {
            username: api.username + "@" + api.tenant,
            password: api.password
          },
          headers
        }    
        ).then(async (response) => {
          const xml = response.data;
          const soap= new Soap();
          var result = await soap.transform(xml, Soap.xsltTidy); 
          var option = {content: result, language: "xml"};
          await vscode.workspace.openTextDocument(option)
          .then((doc: vscode.TextDocument) => {
              vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false); 
        });
        }).catch((ex) => {
          vscode.window.showErrorMessage("Soap Fail: " + ex );
        });        
      }
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
  }

  private async xmlRefresh(api: any) {
    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    const label = activeTabGroup.activeTab?.label;
    if (activeTabGroup) {
      activeTabGroup.tabs.forEach( async item => {
        var tab = item as vscode.Tab;
        if (tab.label === ApiCallsPanel._tabLabel) {
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
    }
  }

  private async _drpConnectionOnChange(text : string) {
    try {
      await vscode.workspace.getConfiguration().update('erp-helper.connectionSelected', text, true);
        const conns = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
        const conn = conns.filter(item => item.name === text);
        if (conn.length === 0) {
          throw new Error("No connections found for " + text);
        }
        if (conn.length === 1) {
          var password = await this._secrets?.get("erp-helper-" + text);
            if (password) {
              conn[0].password = password;
            }
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

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "apicalls.js"]);
    const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
	
    const nonce = getNonce();
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" href="${styleUri}">
          <title>ERP Helper</title>
        </head>
        <body>
          <h1>Make API Requests using a Document</h1>
          <div class="dropdown-container">
            <label for="drpConnection">Connection</label><br/>
            <vscode-dropdown id="drpConnection" />
          </div>
          <br/>
          <div class="textfield-container">
            <label for="txtTenant">Tenant</label><br/>
            <vscode-text-field id="txtTenant" readonly="true" />
          </div>
          <br/>
          <div class="textfield-container">
            <label for="txtUsername">Username</label><br/>
            <vscode-text-field id="txtUsername" readonly="true"/>
          </div>
          <div class="dropdown-container">
            <label for="drpWebService">Service</label><br/>
            <vscode-dropdown id="drpWebService"/>
          </div>
          <br/>
          <vscode-text-field placeholder="v39.1" type="text" id="txtVersion" name="txtVersion" value="v39.1">Version</vscode-text-field>
          <br/>
          <input type="hidden" id="txtUrl"/>
          <input type="hidden" id="txtPassword"/>
          <vscode-link id="lnkUrl" href=""></vscode-link>
          <br/><br/>
          <vscode-button id="btnCallApi">Call API</vscode-button>
          <br/><br/>
          <br/>
         
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

}