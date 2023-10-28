"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webview_ui_toolkit_1 = require("@vscode/webview-ui-toolkit");
(0, webview_ui_toolkit_1.provideVSCodeDesignSystem)().register((0, webview_ui_toolkit_1.vsCodeButton)(), (0, webview_ui_toolkit_1.vsCodeDropdown)(), (0, webview_ui_toolkit_1.vsCodeOption)(), (0, webview_ui_toolkit_1.vsCodeTextField)(), (0, webview_ui_toolkit_1.vsCodeLink)(), (0, webview_ui_toolkit_1.vsCodeRadioGroup)(), (0, webview_ui_toolkit_1.vsCodeRadio)());
const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'formLoad':
            formLoad(message.message);
            break;
        case "btnTestOnClick":
            let $ = getElements();
            urlSet(message.message);
            if ($.txtUrl.value.length > 0) {
                const btnSave = document.getElementById("btnSave");
                btnSave.disabled = false;
            }
            break;
        case 'btnSaveOnClick':
            // n/a
            break;
        case 'rdgConnectionOnChange':
            connectionLoad(message.message);
            break;
    }
});
function main() {
    vscode.postMessage({
        command: "formLoad",
        text: "",
    });
    const btnNew = document.getElementById("btnNew");
    btnNew === null || btnNew === void 0 ? void 0 : btnNew.addEventListener("click", btnNewOnClick);
    const btnTest = document.getElementById("btnTest");
    btnTest === null || btnTest === void 0 ? void 0 : btnTest.addEventListener("click", btnTestOnClick);
    const btnSave = document.getElementById("btnSave");
    btnSave === null || btnSave === void 0 ? void 0 : btnSave.addEventListener("click", btnSaveOnClick);
    const btnDelete = document.getElementById("btnDelete");
    btnDelete === null || btnDelete === void 0 ? void 0 : btnDelete.addEventListener("click", btnDeleteOnClick);
    const rdgConnection = document.getElementById("rdgConnection");
    rdgConnection === null || rdgConnection === void 0 ? void 0 : rdgConnection.addEventListener("change", rdgConnectionOnChange);
    const txtTenant = document.getElementById("txtTenant");
    txtTenant === null || txtTenant === void 0 ? void 0 : txtTenant.addEventListener("change", txtTenantOnChange);
    const txtUsername = document.getElementById("txtUsername");
    txtUsername === null || txtUsername === void 0 ? void 0 : txtUsername.addEventListener("change", txtUsernameOnChange);
    const txtPassword = document.getElementById("txtPassword");
    txtPassword === null || txtPassword === void 0 ? void 0 : txtPassword.addEventListener("change", txtPasswordOnChange);
}
function formLoad(text) {
    btnNewOnClick();
    let $ = getElements();
    const rows = text.split('\n');
    const max = $.rdgConnection.childNodes.length - 1;
    for (var i = max; i >= 0; i--) {
        $.rdgConnection.childNodes[i].remove();
    }
    var selectedValue = "";
    rows.filter((row) => row.length > 0).forEach((row) => {
        const name = row.split('|')[0];
        const selected = row.split('|')[1];
        var radio = document.createElement('vscode-radio');
        radio.name = 'connection';
        radio.innerHTML = name;
        radio.value = name;
        if (selected === 'Y') {
            selectedValue = radio.value;
            radio.checked = true;
        }
        // select 1st value if no saved selection
        if (selectedValue.length === 0) {
            selectedValue = radio.value;
        }
        $.rdgConnection.appendChild(radio);
    });
    if (selectedValue.length > 0) {
        $.rdgConnection.value = selectedValue;
        $.txtName.disabled = true;
    }
    vscode.postMessage({
        command: "rdgConnectionOnChange",
        text: selectedValue,
    });
}
function rdgConnectionOnChange() {
    let $ = getElements();
    urlSet("");
    $.rdgConnection.childNodes.forEach(radio => {
        var r = radio;
        if (r.checked) {
            vscode.postMessage({
                command: "rdgConnectionOnChange",
                text: r.value,
            });
        }
    });
}
function txtTenantOnChange() {
    urlSet("");
}
function txtUsernameOnChange() {
    urlSet("");
}
function txtPasswordOnChange() {
    urlSet("");
}
function btnTestOnClick() {
    let $ = getElements();
    urlSet("");
    const test = {
        "name": $.txtName.value,
        "env": $.drpEnv.value,
        "tenant": $.txtTenant.value,
        "username": $.txtUsername.value,
        "password": $.txtPassword.value
    };
    vscode.postMessage({
        command: "btnTestOnClick",
        data: test,
    });
}
function btnSaveOnClick() {
    let $ = getElements();
    const save = {
        "name": $.txtName.value,
        "env": $.drpEnv.value,
        "url": $.txtUrl.value,
        "tenant": $.txtTenant.value,
        "username": $.txtUsername.value,
        "password": $.txtPassword.value
    };
    vscode.postMessage({
        command: "btnSaveOnClick",
        data: save,
    });
    $.txtName.disabled = true;
    const btnSave = document.getElementById("btnSave");
    btnSave.disabled = true;
}
function btnDeleteOnClick() {
    let $ = getElements();
    if ($.rdgConnection && $.rdgConnection.value.length > 0) {
        const del = {
            "name": $.rdgConnection.value,
        };
        vscode.postMessage({
            command: "btnDeleteOnClick",
            data: del,
        });
    }
}
function btnNewOnClick() {
    let $ = getElements();
    $.rdgConnection.childNodes.forEach(radio => { var r = radio; r.checked = false; });
    $.rdgConnection.value = "";
    $.txtName.disabled = false;
    $.drpEnv.selectedIndex = -1;
    urlSet("");
    $.txtName.value = '';
    $.txtTenant.value = '';
    $.txtUsername.value = '';
    $.txtPassword.value = '';
    const btnSave = document.getElementById("btnSave");
    btnSave.disabled = true;
}
function connectionLoad(data) {
    if (data) {
        let $ = getElements();
        $.txtName.value = data.name;
        $.txtName.disabled = true;
        $.drpEnv.value = data.env;
        urlSet(data.url);
        $.txtTenant.value = data.tenant;
        $.txtUsername.value = data.username;
        $.txtPassword.value = data.password;
    }
    const btnSave = document.getElementById("btnSave");
    btnSave.disabled = true;
}
function getElements() {
    const rdgConnection = document.getElementById("rdgConnection");
    const txtName = document.getElementById("txtName");
    const drpEnv = document.getElementById("drpEnv");
    const txtTenant = document.getElementById("txtTenant");
    const txtUsername = document.getElementById("txtUsername");
    const txtPassword = document.getElementById("txtPassword");
    const txtUrl = document.getElementById("txtUrl");
    const lnkUrl = document.getElementById("lnkUrl");
    return { rdgConnection, txtName, drpEnv, txtTenant, txtUrl, lnkUrl, txtUsername, txtPassword };
}
function urlSet(value) {
    const txtUrl = document.getElementById("txtUrl");
    const lnkUrl = document.getElementById("lnkUrl");
    txtUrl.value = value;
    lnkUrl.innerHTML = value;
}
