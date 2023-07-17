import { provideVSCodeDesignSystem, 
  vsCodeButton, Button, vsCodeDropdown, vsCodeOption, Option, 
  Dropdown, vsCodeTextField, TextField, DropdownOptions, vsCodeLink} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), 
  vsCodeOption(), vsCodeTextField(), vsCodeLink());

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
        const txtVersion = document.getElementById("txtVersion") as HTMLInputElement;
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

  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  drpWebService?.addEventListener("change", drpWebServiceOnChange);

  const drpWebOperation = document.getElementById("drpWebOperation") as Dropdown;
  drpWebOperation?.addEventListener("change", drpWebOperationOnChange); 

  const btnGenRequest = document.getElementById("btnGenRequest") as Button;
  btnGenRequest?.addEventListener("click", btnGenRequestOnClick);
  
  const txtVersion = document.getElementById("txtVersion") as TextField;
  txtVersion?.addEventListener("change", txtVersionOnChange);

}

function drpWebServiceOnChange(this: any) {
  vscode.postMessage({
    command: "drpWebServiceOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function drpWebOperationOnChange(this: any) {
  vscode.postMessage({
    command: "drpWebOperationOnChange",
    text: this.options[this.selectedIndex].value,
  });
}

function txtVersionOnChange(this: any) {
  vscode.postMessage({
    command: "txtVersionOnChange",
    text: this.value,
  });
}

function btnGenRequestOnClick() {
  const drpWebService = document.getElementById("drpWebService") as Dropdown;
  const drpWebOperation = document.getElementById("drpWebOperation") as Dropdown;
  const txtVersion = document.getElementById("txtVersion") as TextField;
  vscode.postMessage({
    command: "btnGenRequestOnClick",
    text: drpWebService.options[drpWebService.selectedIndex].text + "|" + txtVersion.value + "|" + drpWebOperation.options[drpWebOperation.selectedIndex].text
  });
}

function webServicesLoad(text : string) {
  var select = document.getElementById("drpWebService") as Dropdown;
  if (select) {
    select.selectedIndex = 0;
    const max = select.childNodes.length - 1;
    for(var i = max; i >= 0; i--) {
      select.childNodes[i].remove();
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

function webOperationsLoad(text : string) {
  var select = document.getElementById("drpWebOperation") as Dropdown;
  if (select) {
    select.selectedIndex = 0;
    const max = select.childNodes.length - 1;
    for(var i = max; i >= 0; i--) {
      select.childNodes[i].remove();
    }    
    var rows = text.split('\n');
    var selectedValue = "";
    rows.forEach(row => {
      var opt = document.createElement('vscode-option') as Option;
      opt = new Option(row.split('|')[0],  row.split('|')[1]);
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

