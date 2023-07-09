import { provideVSCodeDesignSystem, 
  vsCodeButton, Button, vsCodeDropdown, vsCodeOption, Option, 
  Dropdown, vsCodeTextField, TextField, DropdownOptions, vsCodeLink, vsCodeRadioGroup} from "@vscode/webview-ui-toolkit";
import { Drop } from "esbuild";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), 
  vsCodeOption(), vsCodeTextField(), vsCodeLink());

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
      case 'formLoad':
        connectionsLoad(message.message);
        break;
      case 'formLoadWebServices':
        webServicesLoad(message.message);
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
    command: "formLoadWebServices",
    text: "",
  });
  
  vscode.postMessage({
    command: "formLoad",
    text: "",
  });

  const drpConnection = document.getElementById("drpConnection") as Dropdown;
  drpConnection?.addEventListener("change", handleConnectionOnChange);

  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  drpWebService?.addEventListener("change", handleWebServiceOnChange);

  const genRequestButton = document.getElementById("btnCallApi") as Button;
  genRequestButton?.addEventListener("click", handleBtnCallApiOnClick); 

  const btnRefresh = document.getElementById("btnRefresh") as Button;
  btnRefresh?.addEventListener("click", handleBtnRefreshOnClick); 

}

function handleConnectionOnChange(this: any) {
  vscode.postMessage({
    command: "drpConnectionOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function handleWebServiceOnChange(this: any) {
  vscode.postMessage({
    command: "drpWebServiceOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function handleBtnCallApiOnClick() {
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

function handleBtnRefreshOnClick() {  
  vscode.postMessage({
    command: "btnRefreshClick",
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
    $.txtTenant.value = data.tenant;
    $.txtUsername.value = data.username;
    $.txtPassword.value = data.password;
  }
}

function getElements() {
  const drpConnection = document.getElementById("drpConnection") as Dropdown;
  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  const txtVersion = document.getElementById("txtVersion") as TextField;
  const txtName = document.getElementById("txtName") as TextField;
  const txtUrl = document.getElementById("txtUrl") as Dropdown;
  const txtTenant = document.getElementById("txtTenant") as TextField;
  const txtUsername = document.getElementById("txtUsername") as TextField;
  const txtPassword = document.getElementById("txtPassword") as TextField;

  return {drpConnection, drpWebService, txtVersion, txtName, txtUrl, txtTenant, txtUsername, txtPassword};
}


