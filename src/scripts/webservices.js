"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webview_ui_toolkit_1 = require("@vscode/webview-ui-toolkit");
(0, webview_ui_toolkit_1.provideVSCodeDesignSystem)().register((0, webview_ui_toolkit_1.vsCodeButton)(), (0, webview_ui_toolkit_1.vsCodeDropdown)(), (0, webview_ui_toolkit_1.vsCodeOption)(), (0, webview_ui_toolkit_1.vsCodeTextField)(), (0, webview_ui_toolkit_1.vsCodeLink)());
const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
window.addEventListener('message', event => {
    const message = event.data;
    const text = message.message;
    switch (message.command) {
        case 'formLoad':
            webServicesLoad(message.message);
            break;
        case 'drpWebServiceOnChange':
            webOperationsLoad(message.message);
            break;
        case "txtVersionLoad":
            const txtVersion = document.getElementById("txtVersion");
            if (text && text.length > 0) {
                txtVersion.value = text;
            }
            break;
    }
});
function main() {
    vscode.postMessage({
        command: "formLoad",
        text: "",
    });
    vscode.postMessage({
        command: "txtVersionLoad",
        text: "",
    });
    const drpWebService = document.getElementById("drpWebService");
    drpWebService === null || drpWebService === void 0 ? void 0 : drpWebService.addEventListener("change", drpWebServiceOnChange);
    const drpWebOperation = document.getElementById("drpWebOperation");
    drpWebOperation === null || drpWebOperation === void 0 ? void 0 : drpWebOperation.addEventListener("change", drpWebOperationOnChange);
    const btnGenRequest = document.getElementById("btnGenRequest");
    btnGenRequest === null || btnGenRequest === void 0 ? void 0 : btnGenRequest.addEventListener("click", btnGenRequestOnClick);
    const txtVersion = document.getElementById("txtVersion");
    txtVersion === null || txtVersion === void 0 ? void 0 : txtVersion.addEventListener("change", txtVersionOnChange);
}
function drpWebServiceOnChange() {
    vscode.postMessage({
        command: "drpWebServiceOnChange",
        text: this.options[this.selectedIndex].value,
    });
}
function drpWebOperationOnChange() {
    vscode.postMessage({
        command: "drpWebOperationOnChange",
        text: this.options[this.selectedIndex].value,
    });
}
function txtVersionOnChange() {
    vscode.postMessage({
        command: "txtVersionOnChange",
        text: this.value,
    });
}
function btnGenRequestOnClick() {
    const drpWebService = document.getElementById("drpWebService");
    const drpWebOperation = document.getElementById("drpWebOperation");
    const txtVersion = document.getElementById("txtVersion");
    vscode.postMessage({
        command: "btnGenRequestOnClick",
        text: drpWebService.options[drpWebService.selectedIndex].text + "|" + txtVersion.value + "|" + drpWebOperation.options[drpWebOperation.selectedIndex].text
    });
}
function webServicesLoad(text) {
    var select = document.getElementById("drpWebService");
    if (select) {
        select.selectedIndex = 0;
        const max = select.childNodes.length - 1;
        for (var i = max; i >= 0; i--) {
            select.childNodes[i].remove();
        }
        var rows = text.split('\n');
        var selectedValue = "";
        rows.forEach(row => {
            var opt = document.createElement('vscode-option');
            opt = new webview_ui_toolkit_1.Option(row.split('|')[0], row.split('|')[1]);
            if (row.split('|')[2] === 'Y') {
                selectedValue = row.split('|')[1];
                opt.selected = true;
            }
            // select 1st value if no saved selection
            if (selectedValue.length === 0) {
                selectedValue = row.split('|')[1];
            }
            select.appendChild(opt);
        });
        select.value = selectedValue;
        vscode.postMessage({
            command: "drpWebServiceOnChange",
            text: selectedValue,
        });
    }
}
function webOperationsLoad(text) {
    var select = document.getElementById("drpWebOperation");
    if (select) {
        select.selectedIndex = 0;
        const max = select.childNodes.length - 1;
        for (var i = max; i >= 0; i--) {
            select.childNodes[i].remove();
        }
        var rows = text.split('\n');
        var selectedValue = "";
        rows.forEach(row => {
            var opt = document.createElement('vscode-option');
            opt = new webview_ui_toolkit_1.Option(row.split('|')[0], row.split('|')[1]);
            if (row.split('|')[2] === 'Y') {
                opt.selected = true;
                selectedValue = row.split('|')[1];
            }
            // select 1st value if no saved selection
            if (selectedValue.length === 0) {
                selectedValue = row.split('|')[1];
            }
            select.appendChild(opt);
        });
        select.value = selectedValue;
    }
}
