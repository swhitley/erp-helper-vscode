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
            // Get all cells and look for lists        
            const cells = cell.notebook.getCells();
            var lists: Record<string, string> = {};
            var keyValue: {row: number, key: string, value: string};
            var keyValues = new Array<typeof keyValue>();
            var outputList = false;
            var outputHtmlType = false;
            cells.forEach(doc => {
                var lines = doc.document.getText().split('\n');
                // Check for a 'LIST' command
                if (lines.length > 0 && lines[0].trim().toLowerCase().indexOf('list') === 0 && 
                        lines[0].trim().split(' ').length > 1) {
                    if (lines[0].trim().split(' ').length === 3) {
                        if (lines[0].trim().split(' ')[2].trim().toLowerCase() === 'output') {
                            outputList = true;
                        }
                    }
                    // List name array
                    const listName = lines[0].trim().split(' ')[1];
                    const setLines = new Set(lines);
                    var uniqueLines = [...setLines];
                    uniqueLines.shift();
                    // Remove empty lines
                    uniqueLines = uniqueLines.filter(function(e){return e.trim().length > 0;});
                    uniqueLines = uniqueLines.map(function(e){return e = e.replace('\'', '\\\'');});
                    lists[listName] = '(\'' + uniqueLines.join('\',\'') + '\')';
                    if(outputList) {
                        var index = 0;
                        if (lines) {
                            lines.forEach(line => {
                                keyValue = {row: index++, key: line.trim(), value: ''};
                                keyValues.push(keyValue);               
                            });
                            keyValues.shift();
                        }
                    }                
                }
            });

            // Get the WQL text
            const cellText = execution.cell.document.getText();            

            // Parse cell text
            const cmds = cellText.split(";");
            var wql = '';
        
            cmds.forEach(cmd => {
                if (cmd.trim().length > 0) {
                    if (cmd.trim().split(' ').length > 0) {
                        if (cmd.trim().split(' ').length > 1 && 
                            cmd.trim().split(' ')[0].toLowerCase() === 'output' && 
                            cmd.trim().split(' ')[1].toLowerCase() === 'html') {
                                outputHtmlType = true;
                        }
                        else {
                            wql = cmd;
                        }
                    }                    
                }
            });
            
            if (wql) {
                for (var key in lists) {
                    wql = wql.replace('{' + key + '}', lists[key]);
                }               
            }
            const results = await this.apiCall(wql);

            var outputHtml = '';
            var outputJson = '';
            if (results) {
                outputJson = results;
                const json = JSON.parse(results);
                if (outputList) {
                    if (keyValues && keyValues.length > 0) {
                        keyValues.forEach(keyValue => {
                            if (json.data) {
                                json.data.forEach( (item: typeof keyValue) => {
                                    if (item.key === keyValue.key ) {
                                        keyValue.value = item.value;
                                    }
                                });
                            }
                        });
                        if (json && json.data) {
                            json.data = keyValues;
                        }
                    }
                    outputHtmlType = true;
                }
                if (json.data) {
                    if (outputList) {
                        outputHtml = '<table>';
                        json.data.forEach( (row: { value: string; }) => {
                            outputHtml += '<tr><td>' + row.value + "</td></tr>";
                        });
                        outputHtml += '</table>';
                    }
                    else {
                        var tabularOpts = {
                            dot: "/",
                            separator: '  ',
                            classes: {table: "table table-striped table-bordered"}
                        };                       
                        outputHtml = tabular.html(json.data, tabularOpts);
                    }
                }
            }
            if (outputHtml.length === 0) {
                outputHtml = outputJson;
            }        
            
            var styleUri = '';
            if (this._context) {
                styleUri = this._context?.extensionUri.path + '/dist/style.css';
            }

            var outputText = [];
            var outputMimeType = [];
            if (outputHtmlType) {
                outputText.push(outputHtml);
                outputText.push(outputJson);
                outputMimeType.push('text/html');
                outputMimeType.push('text/plain');                
            }
            else {
                outputText.push(outputJson);
                outputText.push(outputHtml);
                outputMimeType.push('application/json');
                outputMimeType.push('text/html');
            }

            execution.replaceOutput([new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.text(outputText[0], outputMimeType[0]),
                vscode.NotebookCellOutputItem.text(outputText[1], outputMimeType[1])
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
