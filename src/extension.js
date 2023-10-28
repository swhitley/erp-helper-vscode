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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const erpHelper = __importStar(require("./erp-helper"));
const WebServicesPanel_1 = require("./panels/WebServicesPanel");
const ConnectionsPanel_1 = require("./panels/ConnectionsPanel");
const ApiCallsPanel_1 = require("./panels/ApiCallsPanel");
function activate(context) {
    let transformDisposable = vscode.commands.registerCommand("erp-helper.transform", () => __awaiter(this, void 0, void 0, function* () {
        erpHelper.transform();
    }));
    let xsltWrapperDisposable = vscode.commands.registerCommand("erp-helper.xslt-wrapper", () => __awaiter(this, void 0, void 0, function* () {
        erpHelper.xsltWrapper();
    }));
    let soapWrapperDisposable = vscode.commands.registerCommand("erp-helper.soap-wrapper", () => __awaiter(this, void 0, void 0, function* () {
        erpHelper.soapWrapper();
    }));
    const webServicesCommand = vscode.commands.registerCommand("erp-helper.web-services", () => {
        WebServicesPanel_1.WebServicesPanel.render(context.extensionUri);
    });
    const apiCallsCommand = vscode.commands.registerCommand("erp-helper.api-calls", () => {
        ApiCallsPanel_1.ApiCallsPanel.render(context.extensionUri, context.secrets);
    });
    const connectionsCommand = vscode.commands.registerCommand("erp-helper.connections", () => {
        ConnectionsPanel_1.ConnectionsPanel.render(context.extensionUri, context.secrets);
    });
    context.subscriptions.push(webServicesCommand);
    context.subscriptions.push(connectionsCommand);
    context.subscriptions.push(apiCallsCommand);
    context.subscriptions.push(transformDisposable);
    context.subscriptions.push(xsltWrapperDisposable);
    context.subscriptions.push(soapWrapperDisposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
