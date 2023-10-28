"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webview_ui_toolkit_1 = require("@vscode/webview-ui-toolkit");
(0, webview_ui_toolkit_1.provideVSCodeDesignSystem)().register((0, webview_ui_toolkit_1.vsCodeButton)(), (0, webview_ui_toolkit_1.vsCodeDropdown)(), (0, webview_ui_toolkit_1.vsCodeOption)(), (0, webview_ui_toolkit_1.vsCodeTextField)(), (0, webview_ui_toolkit_1.vsCodeLink)(), (0, webview_ui_toolkit_1.vsCodeDivider)());
const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
window.addEventListener('message', event => {
    const message = event.data;
    const text = message.message;
    switch (message.command) {
        case 'formLoad':
            connectionsLoad(message.message);
            break;
        case 'formLoadWebServices':
            webServicesLoad(message.message);
            break;
        case "txtVersionLoad":
            const txtVersion = document.getElementById("txtVersion");
            if (text && text.length > 0) {
                txtVersion.value = text;
            }
            break;
        case 'documentChanged':
            const spnDocument = document.getElementById("spnDocument");
            spnDocument.textContent = message.document;
            break;
        case 'drpConnectionOnChange':
            connectionLoad(message.message);
            break;
        case 'drpWebServiceOnChange':
            break;
    }
});
function main() {
    vscode.postMessage({
        command: "formLoad",
        text: "",
    });
    vscode.postMessage({
        command: "formLoadWebServices",
        text: "",
    });
    vscode.postMessage({
        command: "txtVersionLoad",
        text: "",
    });
    const drpConnection = document.getElementById("drpConnection");
    drpConnection === null || drpConnection === void 0 ? void 0 : drpConnection.addEventListener("change", drpConnectionOnChange);
    const drpWebService = document.getElementById("drpWebService");
    drpWebService === null || drpWebService === void 0 ? void 0 : drpWebService.addEventListener("change", drpWebServiceOnChange);
    const genRequestButton = document.getElementById("btnCallApi");
    genRequestButton === null || genRequestButton === void 0 ? void 0 : genRequestButton.addEventListener("click", btnCallApiOnClick);
    const btnRefresh = document.getElementById("btnRefresh");
    btnRefresh === null || btnRefresh === void 0 ? void 0 : btnRefresh.addEventListener("click", btnRefreshOnClick);
    const lnkConnections = document.getElementById("lnkConnections");
    lnkConnections === null || lnkConnections === void 0 ? void 0 : lnkConnections.addEventListener("click", lnkConnectionsOnClick);
    const lnkWebServices = document.getElementById("lnkWebServices");
    lnkWebServices === null || lnkWebServices === void 0 ? void 0 : lnkWebServices.addEventListener("click", lnkWebServicesOnClick);
    const lnkGetWorkers = document.getElementById("lnkGetWorkers");
    lnkGetWorkers === null || lnkGetWorkers === void 0 ? void 0 : lnkGetWorkers.addEventListener("click", lnkGetWorkersOnClick);
    const txtVersion = document.getElementById("txtVersion");
    txtVersion === null || txtVersion === void 0 ? void 0 : txtVersion.addEventListener("change", txtVersionOnChange);
    const btnShow = document.getElementById("btnShow");
    btnShow === null || btnShow === void 0 ? void 0 : btnShow.addEventListener("click", btnShowOnClick);
    const btnHide = document.getElementById("btnHide");
    btnHide === null || btnHide === void 0 ? void 0 : btnHide.addEventListener("click", btnHideOnClick);
}
function drpConnectionOnChange() {
    vscode.postMessage({
        command: "drpConnectionOnChange",
        text: this.options[this.selectedIndex].value,
    });
}
function drpWebServiceOnChange() {
    vscode.postMessage({
        command: "drpWebServiceOnChange",
        text: this.options[this.selectedIndex].value,
    });
}
function txtVersionOnChange() {
    vscode.postMessage({
        command: "txtVersionOnChange",
        text: this.value,
    });
}
function btnCallApiOnClick() {
    const $ = getElements();
    let api = {
        tenant: $.txtTenant.value,
        username: $.txtUsername.value,
        password: $.txtPassword.value,
        url: $.txtUrl.value,
        service: $.drpWebService.options[$.drpWebService.selectedIndex].text,
        version: $.txtVersion.value,
    };
    vscode.postMessage({
        command: "btnCallApiOnClick",
        data: api
    });
}
function btnShowOnClick() {
    const divConnDetails = document.getElementById("connDetails");
    const btnHide = document.getElementById("btnHide");
    divConnDetails.hidden = false;
    this.hidden = true;
    btnHide.hidden = false;
}
function btnHideOnClick() {
    const divConnDetails = document.getElementById("connDetails");
    const btnShow = document.getElementById("btnShow");
    divConnDetails.hidden = true;
    this.hidden = true;
    btnShow.hidden = false;
}
function btnRefreshOnClick() {
    vscode.postMessage({
        command: "btnRefreshOnClick",
        message: ""
    });
}
function lnkConnectionsOnClick() {
    vscode.postMessage({
        command: "lnkConnectionsOnClick",
        message: ""
    });
}
function lnkWebServicesOnClick() {
    vscode.postMessage({
        command: "lnkWebServicesOnClick",
        message: ""
    });
}
function lnkGetWorkersOnClick() {
    vscode.postMessage({
        command: "lnkGetWorkersOnClick",
        message: ""
    });
}
function connectionsLoad(text) {
    var select = document.getElementById("drpConnection");
    if (select) {
        const max = select.childNodes.length - 1;
        for (var i = max; i >= 0; i--) {
            select.childNodes[i].remove();
        }
    }
    var rows = text.split('\n');
    var selectedValue = "";
    rows.forEach(row => {
        var opt = document.createElement('vscode-option');
        opt = new webview_ui_toolkit_1.Option(row.split('|')[0], row.split('|')[0]);
        if (row.split('|')[1] === 'Y') {
            selectedValue = row.split('|')[0];
            opt.selected = true;
        }
        if (select) {
            select.appendChild(opt);
        }
    });
    select.value = selectedValue;
    vscode.postMessage({
        command: "drpConnectionOnChange",
        text: selectedValue,
    });
}
function webServicesLoad(text) {
    var select = document.getElementById("drpWebService");
    if (select) {
        const max = select.childNodes.length - 1;
        for (var i = max; i >= 0; i--) {
            select.childNodes[i].remove();
        }
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
        if (select) {
            select.appendChild(opt);
        }
    });
    select.value = selectedValue;
    vscode.postMessage({
        command: "drpWebServiceOnChange",
        text: selectedValue,
    });
}
function connectionLoad(data) {
    if (data) {
        let $ = getElements();
        $.txtUrl.value = data.url;
        $.lnkUrl.textContent = data.url;
        $.txtTenant.value = data.tenant;
        $.txtUsername.value = data.username;
        $.txtPassword.value = data.password;
        $.spnTenant.textContent = data.tenant;
        $.spnUsername.textContent = data.username;
    }
}
function getElements() {
    const drpConnection = document.getElementById("drpConnection");
    const drpWebService = document.getElementById("drpWebService");
    const txtVersion = document.getElementById("txtVersion");
    const txtName = document.getElementById("txtName");
    const txtUrl = document.getElementById("txtUrl");
    const lnkUrl = document.getElementById("lnkUrl");
    const txtTenant = document.getElementById("txtTenant");
    const spnTenant = document.getElementById("spnTenant");
    const txtUsername = document.getElementById("txtUsername");
    const spnUsername = document.getElementById("spnUsername");
    const txtPassword = document.getElementById("txtPassword");
    return { drpConnection,
        drpWebService, txtVersion, txtName, txtUrl, lnkUrl,
        txtTenant, spnTenant, txtUsername, spnUsername, txtPassword };
}
