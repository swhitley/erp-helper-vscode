import * as vscode from 'vscode';
import { ConnectionUtils } from './utilities/connection';
import { ExtensionContext } from 'vscode';
const axios = require('axios').default;
var stringify = require('json-stringify-safe');
var tabular = require('tabular-json');

export class NotebookKernel {
    readonly id: string = 'wql-book-kernel';
    readonly notebookType: string = 'wql-book';
    readonly label: string = 'WQL Book';
    readonly supportedLanguages = ['wql-book'];
    private _context?: ExtensionContext;

    private readonly _controller: vscode.NotebookController;
	private _executionOrder = 0;

	constructor(isInteractive?: boolean, context?: ExtensionContext) {
        if (context) {
            this._context = context;
        }
        if (isInteractive) {
            this.id = 'wql-book-interactive-kernel';
            this.notebookType = 'interactive';
        }
        this._controller = vscode.notebooks.createNotebookController(this.id, 
                                                                    this.notebookType, 
                                                                    this.label);

		this._controller.supportedLanguages = ['wql-book'];
		this._controller.supportsExecutionOrder = true;
		this._controller.description = 'A notebook for making WQL calls.';
		this._controller.executeHandler = this._executeAll.bind(this);
	}

	dispose(): void {
		this._controller.dispose();
	}

    private _executeAll(cells: vscode.NotebookCell[], _notebook: vscode.NotebookDocument, _controller: vscode.NotebookController): void {
        for (let cell of cells) {
			this._doExecution(cell);
		}
	}

    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
		execution.start(Date.now());

        try {          
            
            const cellText = execution.cell.document.getText();

            // Parse cell text
            const cmds = cellText.split(";");
            var wql;
        
            cmds.forEach(cmd => {
                if (cmd.trim().length > 0) {
                    wql = cmd;
                }
            }); 

            const results = await this.apiCall(wql);

            var outputHtml = '';
            var outputJson = '';
            if (results) {
                outputJson = results;
                const json = JSON.parse(results);
                if (json.data) {
                    var tabularOpts = {
                        dot: "/",
                        separator: '  ',
                        classes: {table: "table table-striped table-bordered"}
                    };                       
                    outputHtml = tabular.html(json.data, tabularOpts);
                }
            }
            if (outputHtml.length === 0) {
                outputHtml = outputJson;
            }        
            
            var styleUri = '';
            if (this._context) {
                styleUri = this._context?.extensionUri.path + '/dist/style.css';
            }

            execution.replaceOutput([new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.text(outputJson, 'application/json'),
                vscode.NotebookCellOutputItem.text(outputHtml, 'text/html')
            ])]);

            execution.end(true, Date.now());
        } catch (e) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error({ 
                        name: e instanceof Error && e.name || 'error', 
                        message: e instanceof Error && e.message || stringify(e, undefined, 4)})
                ])
            ]);
            execution.end(false, Date.now());
        }

        return;
        
    }

    private async apiCall(wql: any) {
        try {
            if (!this._context) {
               throw Error("Missing context in API call.");
            }

            const limit = 10000;
            const offset = 0;
            const maxLoops = 100;
            const conn = await ConnectionUtils.currentConnection(this._context);
            var restEndpoint = conn.tokenEndpoint.replace("oauth2", "api/wql/v1").replace("/token", "") + "/data?" +
            "limit=" + limit +
            "&offset=" + offset +
            "&query=";

            restEndpoint += encodeURIComponent(wql);
      
            if (conn) {
                let url = restEndpoint;
                let headers = {};
                let config = {};
                
                headers = {
                    'user-agent': 'erp-helper',
                    'Content-Type': 'application/json',
                    'X-Originator': 'erp-helper',
                    'X-Tenant': conn.tenant,
                    'Authorization': 'Bearer ' + conn.accessToken
                };
                config = {
                    headers
                };
                
                var result;
                await axios.get(
                    url,
                    config,
                ).then( (response: { data: any; }) => {
                    result = stringify(response.data);
                }).catch((ex: { response: { data: any; }; }) => {                    
                    let error = ex;
                    if (ex.response) {
                      error = ex.response.data;
                    }
                    result = stringify(error);
                  });  
                return result;  
            }
        }
        catch (ex) {
            vscode.window.showErrorMessage("Unexpected Error: " + ex);
            return;
        }
        finally {
            
        }
    }    

}
