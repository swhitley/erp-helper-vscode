/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from "axios";

export class ConnectionsPanel {
  public static currentPanel: ConnectionsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _connection = { name: "", env: "", url: "", tenant: "", username: "", password: "" };
  private _secrets: vscode.SecretStorage | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, secrets: vscode.SecretStorage) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    this._secrets = secrets;
  }

  public static render(extensionUri: vscode.Uri, secrets: vscode.SecretStorage) {
    if (ConnectionsPanel.currentPanel) {
      ConnectionsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("erp-helper", "Connections", vscode.ViewColumn.One, {
         // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        // Restrict the webview to only load resources from the `out` directory
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });
      ConnectionsPanel.currentPanel = new ConnectionsPanel(panel, extensionUri, secrets);
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
            this.formLoad();
            return;
          case "btnTestOnClick":
            this.btnTestOnClick(message.data);
            return;
          case "btnSaveOnClick":
            this.btnSaveOnClick(message.data);          
            return;
            case "btnDeleteOnClick":
              this.btnDeleteOnClick(message.data);          
              return;
          case "rdgConnectionOnChange":
            await vscode.workspace.getConfiguration().update('erp-helper.connectionSelected', text, true);
            const conns = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
            const conn = conns.filter(item => item.name === text);
            if (conn.length > 0) {
              const password = await this._secrets?.get("erp-helper-" + text); 
              if (password) {
                conn[0].password = password;
              }
              this._panel.webview.postMessage({ command: 'rdgConnectionOnChange', message: conn[0] });
            }
            return;
        }
      },
      undefined,
      this._disposables
    );
    
  }

  public async formLoad() {
    const connections = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
    const connectionSelected = await vscode.workspace.getConfiguration().get('erp-helper.connectionSelected');
    
    const names =  connections.map(connection => { 
      let selected = "N";
      if (connectionSelected === connection.name) {
        selected = "Y";
      }
      return connection.name + "|" + selected; 
    }).join('\n');
    this._panel.webview.postMessage({ command: 'formLoad', message: names });
  }

  public async btnTestOnClick(data: typeof this._connection) {
    const url = await this.ServiceUrlGet(data.env, data.username + "@" + data.tenant, data.password);
    if (url && url.length > 0 && url.indexOf("/ccx/service") > 0) {
      this._panel.webview.postMessage({ command: 'btnTestOnClick', message: url + "/" + data.tenant + "/" });
      vscode.window.showInformationMessage("Successful test.  Click Save to store the connection.");
    }
    else {
      if (url && url.length > 0) {
        vscode.window.showErrorMessage("Connection Test Failed for Url: " + url);
      }
    }
  }

  public async btnSaveOnClick(data : typeof this._connection) {
    if (data.name.length === 0) {
      vscode.window.showErrorMessage("Name is required.");
      return;
    }
    const connSave = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
    
    let exists = false;
    var connNew: Array<typeof this._connection> = new Array<typeof this._connection>();
    
    if (connSave && connSave.length > 0) {
      connSave.forEach( item => {
        if (item.name === data.name) {
          item.env = data.env;
          item.url = data.url;
          item.tenant = data.tenant;
          item.username = data.username;  
          item.password = data.password;   
          exists = true;
          if (data.password !== "[encrypted]") {
            async () => {
              await this._secrets?.store("erp-helper-" + data.name, data.password);  
            };     
          }
        }
        item.password = "[encrypted]";
        connNew.push(item);      
      });
    }
    if (!exists) {
      async () => {
      await this._secrets?.store("erp-helper-" + data.name, data.password);   
      };
      data.password = "[encrypted]";
      connNew.push(data);                 
    }
    await vscode.workspace.getConfiguration().update('erp-helper.connectionList', connNew, true);   
    this.formLoad();
  }

  public async ServiceUrlGet(url: string, username: string, password: string) {
    let result = "";
    try {    
      url = url + "/cc-cloud-master/service-gateway";
      const headers = {
        'user-agent': 'erp-helper',
        'Content-Type': 'text/xml;charset=UTF-8',
      };
      await axios({
        method: 'get',
        url,
        headers,
        data: null,
        auth: {
          username: username,
          password: password
        }     
      }).then((response) => {
        result = response.data;
      }).catch((ex) => {
        vscode.window.showErrorMessage("Service Url lookup error: " + ex);
      });
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }

    return result;
  }

  public async btnDeleteOnClick(data : typeof this._connection) {
    const connSave = await vscode.workspace.getConfiguration().get('erp-helper.connectionList') as Array<typeof this._connection>;
    let exists = false;
    var connNew: Array<typeof this._connection> = new Array<typeof this._connection>();
    connSave.forEach( async item => {
      if (item.name === data.name) {
          await this._secrets?.delete("erp-helper-" + data.name);
        exists = true;
      }
      if (!exists) {
        connNew.push(item);
      }
    });
    await vscode.workspace.getConfiguration().update('erp-helper.connectionList', connNew, true);  
    this.formLoad(); 
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "connections.js"]);
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
                  <vscode-option value="https://e2-enterprise-services1.myworkday.com/ccx">Production (WD1)</vscode-option>
                  <vscode-option value="https://wd3-e2.myworkday.com/ccx">Production (WD3)</vscode-option>
                  <vscode-option value="https://wd5-e2.myworkday.com/ccx">Production (WD5)</vscode-option>
                  <vscode-option value="https://e2.wd10.myworkday.com/ccx">Production (WD10)</vscode-option>
                  <vscode-option value="https://e2.wd12.myworkday.com/ccx">Production (WD12)</vscode-option>
                  <vscode-option value="https://e2.wd102.myworkday.com/ccx">Production (WD102)</vscode-option>
                  <vscode-option value="https://e2.wd103.myworkday.com/ccx">Production (WD103)</vscode-option>
                  <vscode-option value="https://e2.wd104.myworkdaygov.com/ccx">Production (WD104)</vscode-option>
                  <vscode-option value="https://e2.wd105.myworkday.com/ccx">Production (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx">Sandbox (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx">Sandbox (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx">Sandbox (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx">Sandbox (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx">Sandbox (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx">Sandbox (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx">Sandbox (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx">Sandbox (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx">Sandbox (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx">Sandbox Preview (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx">Sandbox Preview (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx">Sandbox Preview (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx">Sandbox Preview (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx">Sandbox Preview (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx">Sandbox Preview (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx">Sandbox Preview (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx">Sandbox Preview (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx">Sandbox Preview (WD105)</vscode-option>
                  <vscode-option value="https://e2-impl-cci.workday.com/ccx">Implementation (WD2)</vscode-option>
                  <vscode-option value="https://wd3-e2-impl.workday.com/ccx">Implementation (WD3)</vscode-option>
                  <vscode-option value="https://wd5-impl-e2.workday.com/ccx">Implementation (WD5)</vscode-option>
                  <vscode-option value="https://impl-e2.wd10.myworkday.com/ccx">Implementation (WD10)</vscode-option>
                  <vscode-option value="https://impl-e2.wd12.myworkday.com/ccx">Implementation (WD12)</vscode-option>
                  <vscode-option value="https://impl-e2.wd102.myworkday.com/ccx">Implementation (WD102)</vscode-option>
                  <vscode-option value="https://impl-e2.wd103.myworkday.com/ccx">Implementation (WD103)</vscode-option>
                  <vscode-option value="https://impl-e2.wd104.myworkdaygov.com/ccx">Implementation (WD104)</vscode-option>
                  <vscode-option value="https://impl-e2.wd105.myworkday.com/ccx">Implementation (WD105)</vscode-option>              
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
              <div class="textfield-container">
                <label for="txtUsername">Username</label><br/>
                <vscode-text-field id="txtUsername"/>
              </div>
              <div class="textfield-container">
                <label for="txtPassword">Password</label><br/>
                <vscode-text-field id="txtPassword" type="password"/>
              </div> 
              <div class="container">
              <div class="left"> 
                <vscode-button id="btnTest">Test</vscode-button>
                <vscode-button id="btnSave" disabled>Save</vscode-button>
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