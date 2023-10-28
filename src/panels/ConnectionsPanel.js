"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsPanel = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = __importStar(require("vscode"));
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
const axios_1 = __importDefault(require("axios"));
class ConnectionsPanel {
    constructor(panel, extensionUri, secrets) {
        this._disposables = [];
        this._connection = { name: "", env: "", url: "", tenant: "", username: "", password: "" };
        this._encrypted = "[encrypted]";
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
        this._secrets = secrets;
    }
    static render(extensionUri, secrets) {
        if (ConnectionsPanel.currentPanel) {
            ConnectionsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        }
        else {
            const panel = vscode.window.createWebviewPanel("erp-helper", "Connections (ERP Helper)", vscode.ViewColumn.One, {
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
    dispose() {
        ConnectionsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
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
                    this._rdgConnectionOnChange(text);
                    return;
            }
        }), undefined, this._disposables);
    }
    formLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            const connections = yield vscode.workspace.getConfiguration().get('erp-helper.connectionList');
            const connectionSelected = yield vscode.workspace.getConfiguration().get('erp-helper.connectionSelected');
            const names = connections.map(connection => {
                let selected = "N";
                if (connectionSelected === connection.name) {
                    selected = "Y";
                }
                return connection.name + "|" + selected;
            }).join('\n');
            this._panel.webview.postMessage({ command: 'formLoad', message: names });
        });
    }
    _rdgConnectionOnChange(text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.workspace.getConfiguration().update('erp-helper.connectionSelected', text, true);
            const conns = yield vscode.workspace.getConfiguration().get('erp-helper.connectionList');
            const conn = conns.filter(item => item.name === text);
            if (conn.length > 0) {
                if (this._secrets) {
                    yield this._secrets.get("erp-helper-" + text).then(password => {
                        if (password) {
                            conn[0].password = password;
                            this._panel.webview.postMessage({ command: 'rdgConnectionOnChange', message: conn[0] });
                        }
                    });
                }
            }
        });
    }
    btnTestOnClick(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = yield this.ServiceUrlGet(data.env, data.username + "@" + data.tenant, data.password);
            if (url && url.length > 0 && url.indexOf("/ccx/service") > 0) {
                this._panel.webview.postMessage({ command: 'btnTestOnClick', message: url + "/" + data.tenant + "/" });
                vscode.window.showInformationMessage("Successful test.\nClick Save to store the connection.", { modal: true });
            }
            else {
                if (url && url.length > 0) {
                    vscode.window.showErrorMessage("Connection Test Failed for Url: " + url);
                }
                else {
                    vscode.window.showErrorMessage("Connection Test Failed.");
                }
            }
        });
    }
    btnSaveOnClick(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.name.length === 0) {
                vscode.window.showErrorMessage("Name is required.");
                return;
            }
            const connSave = yield vscode.workspace.getConfiguration().get('erp-helper.connectionList');
            let exists = false;
            var connNew = new Array();
            if (connSave && connSave.length > 0) {
                connSave.forEach(item => {
                    if (item.name === data.name) {
                        item.env = data.env;
                        item.url = data.url;
                        item.tenant = data.tenant;
                        item.username = data.username;
                        item.password = data.password;
                        exists = true;
                        if (this._secrets) {
                            this._secrets.store("erp-helper-" + data.name, data.password);
                        }
                    }
                    item.password = this._encrypted;
                    connNew.push(item);
                });
            }
            if (!exists) {
                if (this._secrets) {
                    this._secrets.store("erp-helper-" + data.name, data.password);
                }
                data.password = this._encrypted;
                connNew.push(data);
            }
            yield vscode.workspace.getConfiguration().update('erp-helper.connectionList', connNew, true);
            this.formLoad();
        });
    }
    ServiceUrlGet(url, username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = "";
            try {
                url = url + "/cc-cloud-master/service-gateway";
                const headers = {
                    'user-agent': 'erp-helper',
                    'Content-Type': 'text/xml;charset=UTF-8',
                };
                yield (0, axios_1.default)({
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
                    let error = ex;
                    if (ex.response) {
                        error = ex.response.data;
                    }
                    vscode.window.showErrorMessage("Service Url lookup error: " + error);
                });
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            return result;
        });
    }
    btnDeleteOnClick(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const connSave = yield vscode.workspace.getConfiguration().get('erp-helper.connectionList');
            let exists = false;
            var connNew = new Array();
            connSave.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                if (item.name === data.name) {
                    if (this._secrets) {
                        yield this._secrets.delete("erp-helper-" + data.name);
                    }
                    exists = true;
                }
                if (!exists) {
                    connNew.push(item);
                }
            }));
            yield vscode.workspace.getConfiguration().update('erp-helper.connectionList', connNew, true);
            this.formLoad();
        });
    }
    _getWebviewContent(webview, extensionUri) {
        const webviewUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "connections.js"]);
        const styleUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "style.css"]);
        const nonce = (0, getNonce_1.getNonce)();
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
exports.ConnectionsPanel = ConnectionsPanel;
