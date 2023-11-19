import * as vscode from 'vscode';
import * as erpHelper from "./erp-helper";
import { WebServicesPanel} from "./panels/WebServicesPanel";
import { ConnectionsPanel } from "./panels/ConnectionsPanel";
import { ApiCallsPanel } from "./panels/ApiCallsPanel";
import { OAuthProvider } from './providers/oAuthProvider';
import { NotebookKernel } from './notebookKernel';
import { NotebookSerializer } from './notebookSerializer';


export function activate(context: vscode.ExtensionContext) {
	
	let transformDisposable = vscode.commands.registerCommand("erp-helper.transform", async () => {
		erpHelper.transform();	
	});	

	let xsltWrapperDisposable = vscode.commands.registerCommand("erp-helper.xslt-wrapper", async () => {
		erpHelper.xsltWrapper();	
	});	
	
	let soapWrapperDisposable = vscode.commands.registerCommand("erp-helper.soap-wrapper", async () => {
		erpHelper.soapWrapper();	
	});		

	const webServicesCommand = vscode.commands.registerCommand("erp-helper.web-services", () => {
		WebServicesPanel.render(context.extensionUri);
	});

	const apiCallsCommand = vscode.commands.registerCommand("erp-helper.api-calls", () => {
	ApiCallsPanel.render(context);
	});	  

	const connectionsCommand = vscode.commands.registerCommand("erp-helper.connections", () => {
	ConnectionsPanel.render(context);
	});
	  
	context.subscriptions.push(webServicesCommand);
	context.subscriptions.push(connectionsCommand);
	context.subscriptions.push(apiCallsCommand);
	context.subscriptions.push(transformDisposable);
	context.subscriptions.push(xsltWrapperDisposable);
	context.subscriptions.push(soapWrapperDisposable);

	context.subscriptions.push(new OAuthProvider(context));

	// Notebook
	// Regular kernel
	context.subscriptions.push(new NotebookKernel(false, context));
	// Kernel for interactive window
	context.subscriptions.push(new NotebookKernel(true, context));

	context.subscriptions.push(vscode.workspace.registerNotebookSerializer('wql-book', new NotebookSerializer(), {
		transientOutputs: false,
		transientCellMetadata: {
			inputCollapsed: true,
			outputCollapsed: true,
		}
	}));

	
}


export function deactivate() {}
