import { provideVSCodeDesignSystem, 
  vsCodeButton, Button, vsCodeDropdown, vsCodeOption, Option, 
  Dropdown, vsCodeTextField, TextField, DropdownOptions, vsCodeLink, RadioGroup, Radio, vsCodeRadio, vsCodeRadioGroup, Link} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), 
  vsCodeOption(), vsCodeTextField(), vsCodeLink(), vsCodeRadioGroup(), vsCodeRadio());

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
          const btnSave = document.getElementById("btnSave") as Button;
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

  const btnNew = document.getElementById("btnNew") as Button;
  btnNew?.addEventListener("click", btnNewOnClick); 

  const btnTest = document.getElementById("btnTest") as Button;
  btnTest?.addEventListener("click", btnTestOnClick);

  const btnSave = document.getElementById("btnSave") as Button;
  btnSave?.addEventListener("click", btnSaveOnClick); 

  const btnDelete = document.getElementById("btnDelete") as Button;
  btnDelete?.addEventListener("click", btnDeleteOnClick); 

  const rdgConnection = document.getElementById("rdgConnection") as RadioGroup;
  rdgConnection?.addEventListener("change", rdgConnectionOnChange); 

  const txtTenant = document.getElementById("txtTenant") as TextField;
  txtTenant?.addEventListener("change", txtTenantOnChange); 

  const txtUsername = document.getElementById("txtUsername") as TextField;
  txtUsername?.addEventListener("change", txtUsernameOnChange);
  
  const txtPassword = document.getElementById("txtPassword") as TextField;
  txtPassword?.addEventListener("change", txtPasswordOnChange); 

}

function formLoad(text : string) {
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
    $.txtName.disabled = true;
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
    "name" : $.txtName.value,
    "env" : $.drpEnv.value,
    "tenant" : $.txtTenant.value,
    "username" : $.txtUsername.value,
    "password" : $.txtPassword.value
  };
  vscode.postMessage({
    command: "btnTestOnClick",
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
    "password" : $.txtPassword.value
  };
  vscode.postMessage({
    command: "btnSaveOnClick",
    data: save,
  });
  $.txtName.disabled = true;
  const btnSave = document.getElementById("btnSave") as Button;
  btnSave.disabled = true;
}

function btnDeleteOnClick() {
  let $ = getElements();
  const del = {
    "name" : $.txtName.value,
  };
  vscode.postMessage({
    command: "btnDeleteOnClick",
    data: del,
  });

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
 
}

function connectionLoad(data: any) {
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
  const txtUrl = document.getElementById("txtUrl") as TextField;
  const lnkUrl = document.getElementById("lnkUrl") as Link;

  return {rdgConnection, txtName, drpEnv, txtTenant, txtUrl, lnkUrl, txtUsername, txtPassword};
}

function urlSet(value: string) {
  const txtUrl = document.getElementById("txtUrl") as TextField;
  const lnkUrl = document.getElementById("lnkUrl") as Link;
  txtUrl.value = value;
  lnkUrl.innerHTML = value;
  lnkUrl.href = value;
}

