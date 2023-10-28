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
exports.WebServicesPanel = void 0;
const vscode = __importStar(require("vscode"));
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class WebServicesPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._wwsUri = "https://community.workday.com/sites/default/files/file-hosting/productionapi/";
        this._wwsUrl = this._wwsUri + "index.html";
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
    }
    static render(extensionUri) {
        if (WebServicesPanel.currentPanel) {
            WebServicesPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        }
        else {
            const panel = vscode.window.createWebviewPanel("erp-helper", "Web Services (ERP Helper)", vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableCommandUris: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
            });
            WebServicesPanel.currentPanel = new WebServicesPanel(panel, extensionUri);
        }
    }
    dispose() {
        WebServicesPanel.currentPanel = undefined;
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
                    yield this._formLoad();
                    return;
                case "txtVersionLoad":
                    const version = yield vscode.workspace.getConfiguration().get('erp-helper.apiVersionSaved');
                    if (this._panel) {
                        this._panel.webview.postMessage({ command: 'txtVersionLoad', message: version });
                    }
                    return;
                case "drpWebServiceOnChange":
                    yield this._drpWebServiceOnChange(text);
                    return;
                case "drpWebOperationOnChange":
                    yield vscode.workspace.getConfiguration().update('erp-helper.webOperationSelected', text, true);
                    return;
                case "txtVersionOnChange":
                    yield vscode.workspace.getConfiguration().update('erp-helper.apiVersionSaved', text, true);
                    return;
                case "btnGenRequestOnClick":
                    yield this._btnGenRequestOnClick(text);
                    return;
            }
        }), undefined, this._disposables);
    }
    _formLoad() {
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
                    this._panel.webview.postMessage({ command: 'formLoad', message: message });
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
    _btnGenRequestOnClick(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._statusBarItem.text = `$(loading~spin) Processing`;
                this._statusBarItem.show();
                const svc = text.split("|")[0];
                const ver = text.split("|")[1];
                const op = text.split("|")[2];
                const url = this._wwsUri + `${svc}/${ver}/samples/${op}.xml`;
                const genReqResponse = yield axios_1.default.get(url);
                let soap = genReqResponse.data;
                soap = soap.replace("bsvc:version=\"string\"", "bsvc:version=\"" + ver + "\"");
                const declaration = "<?xml version='1.0' encoding=\"UTF-8\"?>\n";
                soap = declaration + soap;
                var option = { content: soap, language: "xml" };
                yield vscode.workspace.openTextDocument(option)
                    .then((doc) => {
                    vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false);
                });
            }
            catch (ex) {
                vscode.window.showErrorMessage("Unexpected Error: " + ex);
                return;
            }
            finally {
                this._statusBarItem.hide();
            }
            return;
        });
    }
    _drpWebServiceOnChange(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._statusBarItem.text = `$(loading~spin) Loading`;
                this._statusBarItem.show();
                yield vscode.workspace.getConfiguration().update('erp-helper.webServiceSelected', text, true);
                const setting = yield vscode.workspace.getConfiguration().get('erp-helper.webOperationSelected');
                const webOpResponse = yield axios_1.default.get(text);
                const xml = webOpResponse.data;
                const $X = cheerio.load(xml, { xml: true });
                const nodes = $X("xsd\\:schema > xsd\\:element");
                let webOpMessage = "";
                nodes.each((index, node) => {
                    const name = $X(node).attr("name");
                    let selected = "N";
                    if (setting === name) {
                        selected = "Y";
                    }
                    webOpMessage += name + "|" + name + "|" + selected + "\n";
                });
                if (this._panel) {
                    this._panel.webview.postMessage({ command: 'drpWebServiceOnChange', message: webOpMessage });
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
    _getWebviewContent(webview, extensionUri) {
        const webviewUri = (0, getUri_1.getUri)(webview, extensionUri, ["out", "webservices.js"]);
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
          <h1>Generate Sample Workday API Requests</h1>
          <div class="dropdown-container">
            <label for="drpWebService">Service</label><br/>
            <vscode-dropdown id="drpWebService" />
          </div>
          <br/>
          <div class="dropdown-container">
            <label for="drpWebOperation">Operation</label><br/>
            <vscode-dropdown id="drpWebOperation"/>
          </div>
          <br/>
          <vscode-text-field placeholder="v40.2" type="text" id="txtVersion" name="txtVersion" value="v40.2">Version</vscode-text-field>
          <br/><br/>
          <vscode-button id="btnGenRequest">Generate Request</vscode-button>
          <br/><br/>
          Resources<br/>
          <vscode-link href="https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html">https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html</vscode-link>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
    }
}
exports.WebServicesPanel = WebServicesPanel;
