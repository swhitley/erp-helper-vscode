/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from "axios";
import { Connection, ConnectionUtils } from "../utilities/connection";

export class ConnectionsPanel {
  public static currentPanel: ConnectionsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private readonly _connection: Connection;
  private _secrets: vscode.SecretStorage | undefined;
  private readonly _encrypted = "[encrypted]";

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._connection = new Connection();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, context.extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._secrets = context.secrets;
  }

  public static render(context: vscode.ExtensionContext) {
    if (ConnectionsPanel.currentPanel) {
      ConnectionsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("erp-helper", "Connections (ERP Helper)", vscode.ViewColumn.One, {
         // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        // Restrict the webview to only load resources from the `out` directory
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out')]
      });
      ConnectionsPanel.currentPanel = new ConnectionsPanel(panel, context);
    }
  }

  public dispose() {
    ConnectionsPanel.currentPanel = undefined;
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
            const connectionSelected = await ConnectionUtils.connectionSelected() as string;            
            this.formLoad(connectionSelected);
            return;
          case "btnAccessTokenGetOnClick":
            this.btnAccessTokenGetOnClick(message.data);
            return;
          case "btnTestOnClick":
            this.btnTestOnClick(message.data);
            return;
          case "btnSaveOnClick":
            var conn = new Connection();
            Object.assign(conn, message.data);
            this.btnSaveOnClick(conn);          
            return;
            case "btnDeleteOnClick":
              this.btnDeleteOnClick(message.data);          
              return;
          case "rdgConnectionOnChange":
            this._rdgConnectionOnChange(text);
            return;
        }
      },
      undefined,
      this._disposables
    );
    
  }

  public async formLoad(connectionSelected: string) {
    const connections = await ConnectionUtils.connectionList();

    const names =  connections.map(connection => { 
      let selected = "N";
      if (connectionSelected === connection.name) {
        selected = "Y";
      }
      return connection.name + "|" + selected; 
    }).join('\n');
    this._panel.webview.postMessage({ command: 'formLoad', message: names });
  }

  private async _rdgConnectionOnChange(text: string) {
    await ConnectionUtils.connectionSelectedSave(text);
    const conn = await ConnectionUtils.currentConnection(this._context);
    this._panel.webview.postMessage({ command: 'rdgConnectionOnChange', message: conn });      
  }

  public async btnAccessTokenGetOnClick(data: Connection) {
    try {
      if (data.clientId.length === 0 ||
          data.authEndpoint.length === 0 ||
          data.tokenEndpoint.length === 0) {
        throw new Error("Please enter all required OAuth values.");
      }
      const connStr = JSON.stringify(data);
      const session = await vscode.authentication.getSession("workday", [connStr], { createIfNone: true });
      this._panel.webview.postMessage({ command: 'btnAccessTokenGetOnClick', message: session.accessToken });
      vscode.window.showInformationMessage("Test and save the connection to store the new access token.", {modal: true});
    }
    catch(ex) {
      vscode.window.showErrorMessage("Get Access Token Error: " + ex);
      return;
    }
  }

  public async btnTestOnClick(data: Connection) {
    const url = await this.ServiceUrlGet(data);
    if (url && url.length > 0 && url.indexOf("/ccx/service") > 0) {
      this._panel.webview.postMessage({ command: 'btnTestOnClick', message: url + "/" + data.tenant + "/" });
      vscode.window.showInformationMessage("Successful Test\nClick Save to store the connection.", {modal: true});
    }
    else {
      if (url && url.length > 0) {
        vscode.window.showErrorMessage("Connection Test Failed for Url: " + url);
      }
      else {
        vscode.window.showErrorMessage("Connection Test Failed.");
      }
    }
  }

  public async btnSaveOnClick(data : Connection) {
    if (data.name.length === 0) {
      vscode.window.showErrorMessage("Name is required.");
      return;
    }

    if (data.url.indexOf("http") < 0) {
      vscode.window.showErrorMessage("Service Url is missing. Please test the connection.");
      return;
    }    

    try {
      const connSave = await ConnectionUtils.connectionList();
      
      let exists = false;
      var connNew: Array<Connection> = new Array<Connection>();
      
      if (connSave && connSave.length > 0) {
        for(let item of connSave) {
          if (item.name === data.name) {
            item.env = data.env;
            item.url = data.url;
            item.tenant = data.tenant;
            item.username = data.username;  
            item.password = data.password;
            item.clientId = data.clientId;
            item.authEndpoint = data.authEndpoint;
            item.tokenEndpoint = data.tokenEndpoint;
            item.accessToken = data.accessToken;  
            exists = true;
            await ConnectionUtils.passwordSave(this._context, data.name, data.password);
            await ConnectionUtils.accessTokenSave(this._context, data.name, data.accessToken);
            await ConnectionUtils.connectionSelectedSave(item.name);
          }
          item.password = this._encrypted;
          item.accessToken = this._encrypted;
          connNew.push(item);
        };
      }
      if (!exists) {
        await ConnectionUtils.passwordSave(this._context, data.name, data.password);
        await ConnectionUtils.accessTokenSave(this._context, data.name, data.accessToken);
        data.password = this._encrypted;
        data.accessToken = this._encrypted;
        connNew.push(data);                 
      }
    
      if (connNew.length > 0) {
        await ConnectionUtils.connectionListSave(connNew);
      }
    }
    catch (ex) {
      vscode.window.showErrorMessage("Save Error: " + ex);
    }
    this.formLoad(data.name);
  }

  public async ServiceUrlGet(conn: Connection) {
    let result = "";
    try {    
      let url = conn.env + "/cc-cloud-master/service-gateway";
      let headers = {};
      let config = {};
      if (!conn.accessToken) {
        headers = {
          'user-agent': 'erp-helper',
          'Content-Type': 'text/xml',
        };
        config =  {
          auth: {
            username: conn.username + "@" + conn.tenant,
            password: conn.password
          },
          headers
        };
      } else {
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
      await axios.get(
        url,
        config
      ).then((response) => {
        result = response.data;
      }).catch((ex) => {
        let error = ex;
        if (ex.response) {
          error = ex.response.data;
        }
        vscode.window.showErrorMessage("Service Url lookup error: " + error);
      });
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }

    return result;
  }

  public async btnDeleteOnClick(data : Connection) {
    const connSave = await ConnectionUtils.connectionList();
    let exists = false;
    var connNew: Array<Connection> = new Array<Connection>();
    connSave.forEach( async item => {
      if (item.name === data.name) {
        await ConnectionUtils.passwordDelete(this._context, data.name);
        await ConnectionUtils.accessTokenDelete(this._context, data.name);
        exists = true;
      }
      if (!exists) {
        connNew.push(item);
      }
    });
    await ConnectionUtils.connectionListSave(connNew);  
    this.formLoad(data.name); 
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "connections.js"]);
    const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);

    const publisher = this._context.extension.packageJSON.publisher;
    const name = this._context.extension.packageJSON.name;
    const redirectUri =  `${vscode.env.uriScheme}://${publisher}.${name}`;
	
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
          <h1>Connections</h1>
          <div id="container">
            <div id="left">
              <div>Connections</div>
              <vscode-radio-group orientation="vertical" id="rdgConnection">
              </vscode-radio-group>
              <br/>
              <vscode-button id="btnNew">New</vscode-button>
            </div>
            <div id="right">
              <div class="textfield-container">
                <label for="txtName">Name</label><br/>
                <vscode-text-field id="txtName"/>
              </div>
              <div class="dropdown-container">
                <label for="drpEnv">URL</label><br/>
                <vscode-dropdown id="drpEnv">
                  <vscode-option value="https://e2-enterprise-services1.myworkday.com/ccx|1">Production (WD1)</vscode-option>
                  <vscode-option value="https://wd3-e2.myworkday.com/ccx|2">Production (WD3)</vscode-option>
                  <vscode-option value="https://wd5-e2.myworkday.com/ccx|3">Production (WD5)</vscode-option>
                  <vscode-option value="https://e2.wd10.myworkday.com/ccx|4">Production (WD10)</vscode-option>
                  <vscode-option value="https://e2.wd12.myworkday.com/ccx|5">Production (WD12)</vscode-option>
                  <vscode-option value="https://e2.wd102.myworkday.com/ccx|6">Production (WD102)</vscode-option>
                  <vscode-option value="https://e2.wd103.myworkday.com/ccx|7">Production (WD103)</vscode-option>
                  <vscode-option value="https://e2.wd104.myworkdaygov.com/ccx|8">Production (WD104)</vscode-option>
                  <vscode-option value="https://e2.wd105.myworkday.com/ccx|9">Production (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx|10">Sandbox (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx|11">Sandbox (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx|12">Sandbox (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx|13">Sandbox (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx|14">Sandbox (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx|15">Sandbox (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx|16">Sandbox (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx|17">Sandbox (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx|18">Sandbox (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx|19">Sandbox Preview (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx|20">Sandbox Preview (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx|21">Sandbox Preview (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx|22">Sandbox Preview (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx|23">Sandbox Preview (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx|24">Sandbox Preview (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx|25">Sandbox Preview (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx|26">Sandbox Preview (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx|27">Sandbox Preview (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx|28">Implementation (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx|29">Implementation (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx|30">Implementation (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx|31">Implementation (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx|32">Implementation (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx|33">Implementation (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx|34">Implementation (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx|35">Implementation (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx|36">Implementation (WD105)</vscode-option>
                </vscode-dropdown>
              </div>
              <div class="textfield-container">
              <vscode-link id="lnkUrl"></vscode-link>
              <input type="hidden" id="txtUrl" />
            </div>
              <div class="textfield-container">
                <label for="txtTenant">Tenant</label><br/>
                <vscode-text-field id="txtTenant"/>
              </div>
              <vscode-panels id="authPanels" activeid="tabBasic">
              <vscode-panel-tab id="tabBasic">Basic Auth</vscode-panel-tab>
              <vscode-panel-tab id="tabOAuth">OAuth 2.0</vscode-panel-tab>
              <vscode-panel-view id="vwBasic">
                  <div class="textfield-container">
                    <label for="txtUsername">Username</label><br/>
                    <vscode-text-field id="txtUsername"/>
                  </div>
                  <div class="container">
                    <div class="left">
                      <div class="textfield-container">
                        <label for="txtPassword">Password</label><br/>
                        <vscode-text-field id="txtPassword" type="password" />
                      </div> 
                    </div>
                    <div class="right">
                    <br/>
                    Stored in <vscode-link href="https://code.visualstudio.com/api/references/vscode-api#SecretStorage">Secret Storage</vscode-link>
                    </div>
                  </div>              
              </vscode-panel-view>
              <vscode-panel-view id="vwOAuth">
                <div class="textfield-container">
                  <h4>Authorization Code Grant with PKCE</h4>
                  <p>Redirect Uri: ${redirectUri}</p>
                </div>
                <vscode-divider></vscode-divider>
                <div class="textfield-container">
                  <label for="txtClientId">Client Id</label><br/>
                  <vscode-text-field id="txtClientId" class="oauth"/>
                </div>     
                <div class="textfield-container">
                  <label for="txtAuthEndpoint">Authorization Endpoint</label><br/>
                  <vscode-text-field id="txtAuthEndpoint" class="oauth"/>
                </div>    
                <div class="textfield-container">
                  <label for="txtTokenEndpoint">Token Endpoint</label><br/>
                  <vscode-text-field id="txtTokenEndpoint" class="oauth"/>
                </div>
                <div class="container">
                  <div class="left">
                    <div class="textfield-container">
                      <label for="txtAccessToken">Access Token</label><br/>
                      <vscode-text-field id="txtAccessToken" type="password" />
                    </div> 
                  </div>
                  <div class="right">
                    <br/>
                    <div class="container">
                      <vscode-button id="btnAccessTokenGet">Get Access Token</vscode-button>  
                    </div>
                  </div>
                </div>                       
              </vscode-panel-view>             
            </vscode-panels>              
              <div class="container">
              <div class="left"> 
                <vscode-button id="btnTest">Test</vscode-button>
                <vscode-button id="btnSave">Save</vscode-button>
              </div>
              <div class="right">
                <vscode-button id="btnDelete">Delete</vscode-button>
              </div>
              </div>
            </div>
          </div>          
          <br/>    
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

}