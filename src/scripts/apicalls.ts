import { provideVSCodeDesignSystem, 
  vsCodeButton, Button, vsCodeDropdown, vsCodeOption, Option, 
  Dropdown, vsCodeTextField, TextField, DropdownOptions, vsCodeLink, 
  vsCodeDivider, vsCodeRadioGroup} from "@vscode/webview-ui-toolkit";
import { Drop } from "esbuild";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), 
  vsCodeOption(), vsCodeTextField(), vsCodeLink(), vsCodeDivider());

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
        const txtVersion = document.getElementById("txtVersion") as HTMLInputElement;
        if (text && text.length > 0) {
          txtVersion.value = text;
        }
        break;
      case 'documentChanged':
        const spnDocument = document.getElementById("spnDocument") as HTMLSpanElement;
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

  const drpConnection = document.getElementById("drpConnection") as Dropdown;
  drpConnection?.addEventListener("change", drpConnectionOnChange);

  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  drpWebService?.addEventListener("change", drpWebServiceOnChange);

  const genRequestButton = document.getElementById("btnCallApi") as Button;
  genRequestButton?.addEventListener("click", btnCallApiOnClick); 

  const btnRefresh = document.getElementById("btnRefresh") as Button;
  btnRefresh?.addEventListener("click", btnRefreshOnClick); 

  const lnkConnections = document.getElementById("lnkConnections") as HTMLLinkElement;
  lnkConnections?.addEventListener("click", lnkConnectionsOnClick); 

  const lnkWebServices = document.getElementById("lnkWebServices") as HTMLLinkElement;
  lnkWebServices?.addEventListener("click", lnkWebServicesOnClick); 

  const lnkGetWorkers = document.getElementById("lnkGetWorkers") as HTMLLinkElement;
  lnkGetWorkers?.addEventListener("click", lnkGetWorkersOnClick); 

  const txtVersion = document.getElementById("txtVersion") as TextField;
  txtVersion?.addEventListener("change", txtVersionOnChange);

}

function drpConnectionOnChange(this: any) {
  vscode.postMessage({
    command: "drpConnectionOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function drpWebServiceOnChange(this: any) {
  vscode.postMessage({
    command: "drpWebServiceOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function txtVersionOnChange(this: any) {
  vscode.postMessage({
    command: "txtVersionOnChange",
    text: this.value,
  });
}

function btnCallApiOnClick() {
  const $ = getElements();
  let api = {
    tenant : $.txtTenant.value,
    username : $.txtUsername.value,
    password : $.txtPassword.value,
    url : $.txtUrl.value,  
    service : $.drpWebService.options[$.drpWebService.selectedIndex].text,
    version : $.txtVersion.value,  
  };
  
  vscode.postMessage({
    command: "btnCallApiOnClick",
    data: api
  });
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

function connectionsLoad(text: string) {
  var select = document.getElementById("drpConnection") as Dropdown;
  if (select) {
    const max = select.childNodes.length - 1;
    for(var i = max; i >= 0; i--) {
      select.childNodes[i].remove();
    }
  }     
  var rows = text.split('\n');
  var selectedValue = "";
  rows.forEach(row => {
    var opt = document.createElement('vscode-option') as Option;
    opt = new Option(row.split('|')[0],  row.split('|')[0]);
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

function webServicesLoad(text : string) {
  var select = document.getElementById("drpWebService") as Dropdown;
  if (select) {
    const max = select.childNodes.length - 1;
    for(var i = max; i >= 0; i--) {
      select.childNodes[i].remove();
    } 
  }    
  var rows = text.split('\n');
  var selectedValue = "";
  rows.forEach(row => {
    var opt = document.createElement('vscode-option') as Option;
    opt = new Option(row.split('|')[0],  row.split('|')[1]);
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

function connectionLoad(data: any) {
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
  const drpConnection = document.getElementById("drpConnection") as Dropdown;
  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  const txtVersion = document.getElementById("txtVersion") as TextField;
  const txtName = document.getElementById("txtName") as TextField;
  const txtUrl = document.getElementById("txtUrl") as Dropdown;
  const lnkUrl = document.getElementById("lnkUrl") as HTMLLinkElement;
  const txtTenant = document.getElementById("txtTenant") as TextField;
  const spnTenant = document.getElementById("spnTenant") as HTMLSpanElement;
  const txtUsername = document.getElementById("txtUsername") as TextField;
  const spnUsername = document.getElementById("spnUsername") as HTMLSpanElement;
  const txtPassword = document.getElementById("txtPassword") as TextField;

  return {drpConnection, 
    drpWebService, txtVersion, txtName, txtUrl, lnkUrl, 
    txtTenant, spnTenant, txtUsername, spnUsername, txtPassword};
}


