"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xsltWrapper = exports.soapWrapper = exports.transform = void 0;
const vscode = __importStar(require("vscode"));
const xmlutil_1 = require("./utilities/xmlutil");
let _statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
function transform() {
    return __awaiter(this, void 0, void 0, function* () {
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
                const input = tab.input;
                const editor = yield vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false });
                if (editor) {
                    const xmlOrXslt = editor.document.getText();
                    if (xml.length === 0) {
                        xml = xmlOrXslt;
                    }
                    else {
                        xslt = xmlOrXslt;
                    }
                }
            }
            try {
                const xmlUtil = new xmlutil_1.XmlUtil();
                var result = yield xmlUtil.transform(xml, xslt);
            }
            catch (ex) {
                vscode.window.showErrorMessage("Transformation Error: " + ex);
                return;
            }
            // Activate the Xslt editor
            if (index !== xsltIndex) {
                const xsltTab = activeTabGroup.tabs.at(xsltIndex);
                if (xsltTab) {
                    const input = xsltTab.input;
                    yield vscode.window.showTextDocument(input.uri, { preserveFocus: true, preview: false });
                }
            }
            var option = { content: result, language: "xml" };
            yield vscode.workspace.openTextDocument(option)
                .then((doc) => __awaiter(this, void 0, void 0, function* () {
                yield vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false);
            }));
        }
        catch (ex) {
            vscode.window.showErrorMessage("Unexpected Error: " + ex);
            return;
        }
        finally {
            _statusBarItem.hide();
        }
    });
}
exports.transform = transform;
function soapWrapper() {
    return __awaiter(this, void 0, void 0, function* () {
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
                const xmlUtil = new xmlutil_1.XmlUtil();
                xml = xmlutil_1.XmlUtil.soapStart + xmlUtil.declarationRemove(text) + xmlutil_1.XmlUtil.soapEnd;
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
    });
}
exports.soapWrapper = soapWrapper;
function xsltWrapper() {
    return __awaiter(this, void 0, void 0, function* () {
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
                    const xmlUtil = new xmlutil_1.XmlUtil();
                    xml = xmlutil_1.XmlUtil.styleSheetStart + xmlUtil.declarationRemove(text) + xmlutil_1.XmlUtil.styleSheetEnd;
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
    });
}
exports.xsltWrapper = xsltWrapper;
