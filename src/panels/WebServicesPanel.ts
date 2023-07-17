import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import axios from "axios";
import * as cheerio from "cheerio";


export class WebServicesPanel {
  public static currentPanel: WebServicesPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _wwsUri= "https://community.workday.com/sites/default/files/file-hosting/productionapi/";
  private readonly _wwsUrl = this._wwsUri + "index.html";     

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (WebServicesPanel.currentPanel) {
      WebServicesPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel("erp-helper", "Web Services (ERP Helper)", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableCommandUris: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });

      WebServicesPanel.currentPanel = new WebServicesPanel(panel, extensionUri);
    }
  }

  public dispose() {
    WebServicesPanel.currentPanel = undefined;

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
          case "txtVersionLoad":
            const version = await vscode.workspace.getConfiguration().get('erp-helper.apiVersionSaved');
            if (this._panel) {
              this._panel.webview.postMessage({ command: 'txtVersionLoad', message: version });
            }
            return;
          case "drpWebServiceOnChange":
            await this._drpWebServiceOnChange(text);
            return;
          case "drpWebOperationOnChange":
            await vscode.workspace.getConfiguration().update('erp-helper.webOperationSelected', text, true);
            return;
          case "txtVersionOnChange":
            await vscode.workspace.getConfiguration().update('erp-helper.apiVersionSaved', text, true);
            return;
          case "btnGenRequestOnClick":
            await this._btnGenRequestOnClick(text);
            return;
        }
      },
      undefined,
      this._disposables
    );    
  }

  private async _formLoad() {
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
        this._panel.webview.postMessage({ command: 'formLoad', message: message });
      }
    }
    catch(ex) {
        vscode.window.showErrorMessage("Unexpected Error: " + ex);
        return;
    }
  }

  private async _btnGenRequestOnClick(text : string) {
    try {
      const svc = text.split("|")[0];
      const ver = text.split("|")[1];
      const op = text.split("|")[2];
      const url = this._wwsUri + `${svc}/${ver}/samples/${op}.xml`;
      const genReqResponse = await axios.get(url);
      let soap = genReqResponse.data;
      soap = soap.replace("bsvc:version=\"string\"", "bsvc:version=\"" + ver + "\"");
      const declaration = "<?xml version='1.0' encoding=\"UTF-8\"?>\n";
      soap = declaration + soap;
      var option = {content: soap, language: "xml"};
      await vscode.workspace.openTextDocument(option)
        .then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false); 
      });
    }
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
    return;
  }

  private async _drpWebServiceOnChange(text : string) {
    try {
      await vscode.workspace.getConfiguration().update('erp-helper.webServiceSelected', text, true);
      const setting = await vscode.workspace.getConfiguration().get('erp-helper.webOperationSelected');
      const webOpResponse = await axios.get(text);
      const xml = webOpResponse.data;
      const $X = cheerio.load(xml, {xml: true});
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
    catch(ex) {
      vscode.window.showErrorMessage("Unexpected Error: " + ex);
      return;
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "webservices.js"]);
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
          <vscode-text-field placeholder="v39.1" type="text" id="txtVersion" name="txtVersion" value="v39.1">Version</vscode-text-field>
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