import { provideVSCodeDesignSystem, 
  vsCodeButton, Button, vsCodeDropdown, vsCodeOption, Option, 
  Dropdown, vsCodeTextField, TextField, DropdownOptions, vsCodeLink, 
  RadioGroup, Radio, vsCodeRadio, vsCodeRadioGroup, Link,
  vsCodePanels, vsCodePanelTab, vsCodePanelView, Panels, PanelTab

} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), 
  vsCodeOption(), vsCodeTextField(), vsCodeLink(), vsCodeRadioGroup(), 
  vsCodeRadio(), vsCodePanels(), vsCodePanelTab(), vsCodePanelView());

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

window.addEventListener('message', event => {
  const message = event.data;
  let $ = getElements();
  switch (message.command) {
    case 'formLoad':
      formLoad(message.message);
      break;
      case "btnTestOnClick":
        urlSet(message.message);
        if ($.txtUrl.value.length > 0) {
          const btnSave = document.getElementById("btnSave") as Button;
          btnSave.disabled = false;
        }
        break;
        case "btnAccessTokenGetOnClick":
          $.txtAccessToken.value = message.message;
        break;        
      case 'btnSaveOnClick':
        if ($.txtName.value.length > 0) {
          $.txtName.disabled = true;
        }
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

  const btnNew = document.getElementById("btnNew") as Button;
  btnNew?.addEventListener("click", btnNewOnClick); 

  const btnTest = document.getElementById("btnTest") as Button;
  btnTest?.addEventListener("click", btnTestOnClick);

  const btnAccessTokenGet = document.getElementById("btnAccessTokenGet") as Button;
  btnAccessTokenGet?.addEventListener("click", btnAccessTokenGetOnClick);
  
  const btnSave = document.getElementById("btnSave") as Button;
  btnSave?.addEventListener("click", btnSaveOnClick); 

  const btnDelete = document.getElementById("btnDelete") as Button;
  btnDelete?.addEventListener("click", btnDeleteOnClick); 

  const rdgConnection = document.getElementById("rdgConnection") as RadioGroup;
  rdgConnection?.addEventListener("change", rdgConnectionOnChange); 

  const drpEnv = document.getElementById("drpEnv") as Dropdown;
  drpEnv?.addEventListener("change", drpEnvOnChange);

  const txtTenant = document.getElementById("txtTenant") as TextField;
  txtTenant?.addEventListener("change", txtTenantOnChange); 

  const txtUsername = document.getElementById("txtUsername") as TextField;
  txtUsername?.addEventListener("change", txtUsernameOnChange);
  
  const txtPassword = document.getElementById("txtPassword") as TextField;
  txtPassword?.addEventListener("change", txtPasswordOnChange); 

}

function formLoad(text : string) {
  btnNewOnClick();
  let $ = getElements();
  const rows = text.split('\n');
  const max = $.rdgConnection.childNodes.length - 1;
  for(var i = max; i >= 0; i--) {
    $.rdgConnection.childNodes[i].remove();
  }
  var selectedValue = "";
  rows.filter((row: string) => row.length > 0).forEach((row: string) => {
    const name = row.split('|')[0];  
    const selected = row.split('|')[1];
    var radio = document.createElement('vscode-radio') as Radio;
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
    if ($.txtName.value.length > 0) {
      $.txtName.disabled = true;
    }
  }
  vscode.postMessage({
    command: "rdgConnectionOnChange",
    text: selectedValue,
  });
}

function rdgConnectionOnChange(this: RadioGroup) {
  let $ = getElements();
  urlSet("");
  $.rdgConnection.childNodes.forEach(radio  => {
    var r = radio as Radio; 
    if (r.checked) {
      vscode.postMessage({
        command: "rdgConnectionOnChange",
        text: r.value,
      });
    }
  });  
}

function drpEnvOnChange(this: Dropdown) {
  urlSet("");
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
  let env = $.drpEnv.value;
  if (env.indexOf("|") ) {
    env = env.split("|")[0];
  }
  const test = {
    "name" : $.txtName.value,
    "env" : env,
    "tenant" : $.txtTenant.value,
    "username" : $.txtUsername.value,
    "password" : $.txtPassword.value,
    "accessToken": $.txtAccessToken.value
  };
  vscode.postMessage({
    command: "btnTestOnClick",
    data: test,
  });
}

function btnAccessTokenGetOnClick() {
  let $ = getElements();
  let env = $.drpEnv.value;
  if (env.indexOf("|") ) {
    env = env.split("|")[0];
  }
  const test = {
    "name" : $.txtName.value,
    "env" : env,
    "tenant" : $.txtTenant.value,
    "username" : $.txtUsername.value,
    "password" : $.txtPassword.value,
    "clientId" : $.txtClientId.value,
    "authEndpoint": $.txtAuthEndpoint.value,
    "tokenEndpoint": $.txtTokenEndpoint.value,
    "accessToken": $.txtAccessToken.value
  };
  vscode.postMessage({
    command: "btnAccessTokenGetOnClick",
    data: test,
  });
}

function btnSaveOnClick() {
  let $ = getElements();
  const save = {
    "name" : $.txtName.value,
    "env" : $.drpEnv.value,
    "url" : $.txtUrl.value,
    "tenant" : $.txtTenant.value,
    "username" : $.txtUsername.value,
    "password" : $.txtPassword.value,
    "clientId": $.txtClientId.value,
    "authEndpoint": $.txtAuthEndpoint.value,
    "tokenEndpoint": $.txtTokenEndpoint.value,
    "accessToken": $.txtAccessToken.value
  };
  vscode.postMessage({
    command: "btnSaveOnClick",
    data: save,
  });
  
  const btnSave = document.getElementById("btnSave") as Button;
  btnSave.disabled = true;
}

function btnDeleteOnClick() {
  let $ = getElements();
  if ($.rdgConnection && $.rdgConnection.value.length > 0) {
    const del = {
      "name" : $.rdgConnection.value,
    };
    vscode.postMessage({
      command: "btnDeleteOnClick",
      data: del,
    });
  }
}

function btnNewOnClick() {
  
  let $ = getElements();
  $.rdgConnection.childNodes.forEach(radio  => {var r = radio as Radio; r.checked = false; });
  $.rdgConnection.value = "";
  $.txtName.disabled = false;
  $.drpEnv.selectedIndex = -1;
  urlSet("");
  $.txtName.value = '';
  $.txtTenant.value = '';
  $.txtUsername.value = '';
  $.txtPassword.value = '';
  $.txtClientId.value = '';
  $.txtAuthEndpoint.value = '';
  $.txtTokenEndpoint.value = '';
  $.txtAccessToken.value = '';
  
  const btnSave = document.getElementById("btnSave") as Button;
  btnSave.disabled = true;
 
}

function connectionLoad(data: any) {
  if (data) {
    let $ = getElements();
    $.txtName.value = data.name;
    if ($.txtName.value.length > 0) {
      $.txtName.disabled = true;
    }
    $.drpEnv.value = data.env;
    urlSet(data.url);
    $.txtTenant.value = data.tenant;
    $.txtUsername.value = data.username;
    $.txtPassword.value = data.password;
    $.txtClientId.value = data.clientId;
    $.txtAuthEndpoint.value = data.authEndpoint;
    $.txtTokenEndpoint.value = data.tokenEndpoint;
    $.txtAccessToken.value = data.accessToken;
    if ($.txtAccessToken.value.length > 0) {
      const authPanels = document.getElementById("authPanels") as Panels;
      authPanels.activeid = "tabOAuth";
    }
    
  }
  const btnSave = document.getElementById("btnSave") as Button;
  btnSave.disabled = true;
}

function getElements() {
  const rdgConnection = document.getElementById("rdgConnection") as RadioGroup;
  const txtName = document.getElementById("txtName") as TextField;
  const drpEnv = document.getElementById("drpEnv") as Dropdown;
  const txtTenant = document.getElementById("txtTenant") as TextField;
  const txtUsername = document.getElementById("txtUsername") as TextField;
  const txtPassword = document.getElementById("txtPassword") as TextField;
  const txtClientId = document.getElementById("txtClientId") as TextField;
  const txtAuthEndpoint = document.getElementById("txtAuthEndpoint") as TextField;
  const txtTokenEndpoint = document.getElementById("txtTokenEndpoint") as TextField;
  const txtAccessToken = document.getElementById("txtAccessToken") as TextField;
  const txtUrl = document.getElementById("txtUrl") as TextField;
  const lnkUrl = document.getElementById("lnkUrl") as Link;

  return {rdgConnection, txtName, drpEnv, txtTenant, txtUrl, lnkUrl, txtUsername, txtPassword, 
    txtClientId, txtAuthEndpoint, txtTokenEndpoint, txtAccessToken};
}

function urlSet(value: string) {
  const txtUrl = document.getElementById("txtUrl") as TextField;
  const lnkUrl = document.getElementById("lnkUrl") as Link;
  txtUrl.value = value;
  lnkUrl.innerHTML = value;
}

