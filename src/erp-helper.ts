import * as vscode from 'vscode'; 
import { XmlUtil } from "./utilities/xmlutil";  
let _statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100); 
    
export async function transform() {       
    let xml = "";
    let xslt = "";
    let xmlIndex = 0;
    let xsltIndex = 0;

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    if (!activeTabGroup || !activeTabGroup.activeTab) {
        return;
    }
    
    try {
        _statusBarItem.text = `$(loading~spin) Processing`;
	    _statusBarItem.show();
        const text = activeEditor.document.getText();
        let index = activeTabGroup.tabs.indexOf(activeTabGroup.activeTab);
        if (text.toLowerCase().indexOf("<xsl:stylesheet") >= 0) {
            xslt = text;
            xsltIndex = index;
            index--;
            xmlIndex = index;
        }
        else {
            xml = text;
            xmlIndex = index;
            index++;
            xsltIndex = index;
        }	

        const tab = activeTabGroup.tabs.at(index);
        if (tab) {	
            const input  = (tab.input as vscode.TabInputText);
            const editor =  await vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false });
            if(editor) {
                const xmlOrXslt =  editor.document.getText();
                if (xml.length === 0) {
                    xml = xmlOrXslt;
                }
                else {
                    xslt = xmlOrXslt;
                }
            }
        }

        try {
            const xmlUtil = new XmlUtil();
            var result = await xmlUtil.transform(xml, xslt);         
        }
        catch(ex){
            vscode.window.showErrorMessage("Transformation Error: " + ex);
            return;
        }

        // Activate the Xslt editor
        if (index !== xsltIndex) {
            const xsltTab = activeTabGroup.tabs.at(xsltIndex);
            if (xsltTab) {	
                const input  = (xsltTab.input as vscode.TabInputText);
                await vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false  });
            }
        }

        var option = {content: result, language: "xml"};
        await vscode.workspace.openTextDocument(option)
            .then(async (doc: vscode.TextDocument) => {
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false); 
        });
    }
    catch (ex) {
        vscode.window.showErrorMessage("Unexpected Error: " + ex);
        return;
    }
    finally {
        _statusBarItem.hide();
    }
}

export async function soapWrapper() {

    let xml = "";
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    try {
        _statusBarItem.text = `$(loading~spin) Processing`;
	    _statusBarItem.show();
        const text = activeEditor.document.getText();
        if (text.toLowerCase().indexOf("<xsd:envelope") >= 0) { 
            vscode.window.showErrorMessage("This is already a SOAP document.");
        }
        else {
            const xmlUtil = new XmlUtil();
            xml = XmlUtil.soapStart.replace("{security}", XmlUtil.soapSecurity) + xmlUtil.declarationRemove(text) + XmlUtil.soapEnd;
            const doc = activeEditor.document;
            activeEditor.edit(builder => {
                builder.replace(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), xml);
            });
        }
    }
    catch (ex) {
        vscode.window.showErrorMessage("Unexpected Error: " + ex);
        return;
    }
    finally {
        _statusBarItem.hide();
    }    

}

export async function xsltWrapper() {

    let xml = "";
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    try {
        _statusBarItem.text = `$(loading~spin) Processing`;
	    _statusBarItem.show();
        const text = activeEditor.document.getText();
        if (text.toLowerCase().indexOf("<xsl:stylesheet") >= 0) { 
            vscode.window.showErrorMessage("This is already an XSLT document.");
        }
        else {
            if (text.toLowerCase().indexOf("<xsd:envelope") >= 0) { 
                vscode.window.showErrorMessage("This is already a SOAP document.");
            }
            else {
                const xmlUtil = new XmlUtil();
                xml = XmlUtil.styleSheetStart + xmlUtil.declarationRemove(text) + XmlUtil.styleSheetEnd;
                const doc = activeEditor.document;
                activeEditor.edit(builder => {
                    builder.replace(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), xml);
                });
            }
        }
    }
    catch (ex) {
        vscode.window.showErrorMessage("Unexpected Error: " + ex);
        return;
    }
    finally {
        _statusBarItem.hide();
    }    

}