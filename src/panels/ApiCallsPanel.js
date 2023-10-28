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
exports.ApiCallsPanel = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = __importStar(require("vscode"));
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
const xmlutil_1 = require("../utilities/xmlutil");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class ApiCallsPanel {
    constructor(panel, extensionUri, secrets) {
        this._disposables = [];
        this._wwsUri = "https://community.workday.com/sites/default/files/file-hosting/productionapi/";
        this._wwsUrl = this._wwsUri + "index.html";
        this._connection = { name: "", url: "", tenant: "", username: "", password: "" };
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
        this._secrets = secrets;
        vscode.window.onDidChangeActiveTextEditor(this._onDidChangeActiveTextEditor, this, this._disposables);
    }
    static render(extensionUri, secrets) {
        // Save the text from the active editor.
        if (vscode.window.activeTextEditor) {
            this._xml = vscode.window.activeTextEditor.document.getText();
        }
        // Save the label from the active editor.
        if (vscode.window.tabGroups.activeTabGroup.activeTab) {
            this._tabLabel = vscode.window.tabGroups.activeTabGroup.activeTab.label;
        }
        if (ApiCallsPanel.currentPanel) {
            ApiCallsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        }
        else {
            const panel = vscode.window.createWebviewPanel("erp-helper", "API Calls (ERP Helper)", vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableCommandUris: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
            });
            ApiCallsPanel.currentPanel = new ApiCallsPanel(panel, extensionUri, secrets);
        }
    }
    dispose() {
        ApiCallsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    _onDidChangeActiveTextEditor() {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.tabGroups.activeTabGroup.activeTab) {
                ApiCallsPanel._tabLabel = vscode.window.tabGroups.activeTabGroup.activeTab.label;
                this._panel.webview.postMessage({ command: 'documentChanged', document: ApiCallsPanel._tabLabel });
            }
        }
    }
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            const command = message.command;
            const text = message.text;
            switch (command) {
                case "formLoad":
                    yield this._formLoad();
                    return;
                case "formLoadWebServices":
                    yield this._formLoadWebServices();
                    return;
                case "txtVersionLoad":
                    const version = yield vscode.workspace.getConfiguration().get('erp-helper.apiVersionSaved');
                    if (this._panel) {
                        this._panel.webview.postMessage({ command: 'txtVersionLoad', message: version });
                    }
                    return;
                case "drpConnectionOnChange":
                    yield this._drpConnectionOnChange(text);
                    return;
                case "drpWebServiceOnChange":
                    yield this._drpWebServiceOnChange(text);
                    return;
                case "txtVersionOnChange":
                    yield vscode.workspace.getConfiguration().update('erp-helper.apiVersionSaved', text, true);
                    return;
                case "btnCallApiOnClick":
                    yield this._btnCallApiOnClick(message.data);
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
        }), undefined, this._disposables);
    }
    _formLoad() {
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
            if (names.length > 0) {
                this._panel.webview.postMessage({ command: 'formLoad', message: names });
                this._panel.webview.postMessage({ command: 'documentChanged', document: ApiCallsPanel._tabLabel });
            }
        });
    }
    _formLoadWebServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._statusBarItem.text = `$(loading~spin) Loading`;
                this._statusBarItem.show();
                const setting = yield vscode.workspace.getConfiguration().get('erp-helper.webServiceSelected');
                const webSvcResponse = yield axios_1.default.get(this._wwsUrl);
                const html = webSvcResponse.data;
                // Use Cheerio to parse the HTML
                const $ = cheerio.load(html);
                const links = $("a");
                // Loop through the selected elements
                let message = "";
                links.each((index, value) => {
                    const href = $(value).attr("href");
                    if (href) {
                        if (href.indexOf(".xsd") > 0) {
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
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            finally {
                this._statusBarItem.hide();
            }
        });
    }
    _btnCallApiOnClick(api) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.xmlRefresh(api);
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            return;
        });
    }
    soapCall(api) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._statusBarItem.text = `$(loading~spin) Processing`;
                this._statusBarItem.show();
                const xmlUtil = new xmlutil_1.XmlUtil();
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
                xml = xmlutil_1.XmlUtil.soapStart + xml + xmlutil_1.XmlUtil.soapEnd;
                xml = xml.replace("{username}", api.username + "@" + api.tenant);
                xml = xml.replace("{password}", api.password);
                if (api) {
                    let url = api.url + api.service + "/" + api.version;
                    const headers = {
                        'user-agent': 'erp-helper',
                        'Content-Type': 'text/xml',
                    };
                    axios_1.default.post(url, xml, {
                        auth: {
                            username: api.username + "@" + api.tenant,
                            password: api.password
                        },
                        headers
                    }).then((response) => __awaiter(this, void 0, void 0, function* () {
                        const xml = response.data;
                        var result = yield xmlUtil.transform(xml, xmlutil_1.XmlUtil.xsltTidy);
                        var option = { content: result, language: "xml" };
                        yield vscode.workspace.openTextDocument(option)
                            .then((doc) => {
                            vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false);
                        });
                    })).catch((ex) => {
                        let error = ex;
                        if (ex.response) {
                            error = ex.response.data;
                        }
                        vscode.window.showErrorMessage("Soap Fail: " + error);
                    });
                }
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            finally {
                this._statusBarItem.hide();
            }
        });
    }
    xmlRefresh(api) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
            const label = (_a = activeTabGroup.activeTab) === null || _a === void 0 ? void 0 : _a.label;
            if (activeTabGroup) {
                activeTabGroup.tabs.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                    var tab = item;
                    if (tab.label === ApiCallsPanel._tabLabel) {
                        const input = tab.input;
                        yield vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false })
                            .then(editor => {
                            ApiCallsPanel._xml = editor.document.getText();
                            this.soapCall(api);
                        });
                        if (ApiCallsPanel.currentPanel) {
                            ApiCallsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
                        }
                    }
                }));
            }
        });
    }
    _drpConnectionOnChange(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._statusBarItem.text = `$(loading~spin) Processing`;
                this._statusBarItem.show();
                yield vscode.workspace.getConfiguration().update('erp-helper.connectionSelected', text, true);
                const conns = yield vscode.workspace.getConfiguration().get('erp-helper.connectionList');
                const conn = conns.filter(item => item.name === text);
                if (conn.length === 0) {
                    throw new Error("No connections found for " + text);
                }
                if (conn.length === 1) {
                    if (this._secrets) {
                        yield this._secrets.get("erp-helper-" + text).then(password => {
                            if (password) {
                                conn[0].password = password;
                                this._panel.webview.postMessage({ command: 'drpConnectionOnChange', message: conn[0] });
                            }
                        });
                    }
                }
                else {
                    throw new Error("More than one connection found for " + text);
                }
                return;
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            finally {
                this._statusBarItem.hide();
            }
        });
    }
    _drpWebServiceOnChange(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vscode.workspace.getConfiguration().update('erp-helper.webServiceSelected', text, true);
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
        });
    }
    _lnkGetWorkersOnClick() {
        return __awaiter(this, void 0, void 0, function* () {
            const xml = xmlutil_1.XmlUtil.getWorkersSample;
            var option = { content: xml, language: "xml" };
            yield vscode.workspace.openTextDocument(option)
                .then((doc) => {
                vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false);
            });
        });
    }
    _getWebviewContent(webview, extensionUri) {
        const webviewUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "apicalls.js"]);
        const styleUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "style.css"]);
        const codiconsUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "codicon.css"]);
        const nonce = (0, getNonce_1.getNonce)();
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
exports.ApiCallsPanel = ApiCallsPanel;
ApiCallsPanel._xml = "";
ApiCallsPanel._tabLabel = "";
