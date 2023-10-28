import * as vscode from "vscode";
import { ExtensionContext } from "vscode";

const ERP_HELPER = 'erp-helper-';
const ERP_HELPER_TOKEN = 'erp-helper-token-';
const CONNECTION_LIST = 'erp-helper.connectionList';
const CONNECTION_SELECTED = 'erp-helper.connectionSelected';

export class Connection {
    name: string = "";
    env: string = "";
    url: string = "";
    tenant: string = "";
    username: string = "";
    password: string = "";
    clientId: string = "";
    authEndpoint: string = "";
    tokenEndpoint: string = "";
    accessToken: string = "";
}

export class ConnectionUtils {

    constructor(private readonly context: ExtensionContext) {}

    public static async passwordSave(context: ExtensionContext, name: string, password: string) {
        await context.secrets.store(ERP_HELPER + name, password);
    }

    public static async passwordGet(context: ExtensionContext, name: string) {
        return await context.secrets.get(ERP_HELPER + name) as string;
    }

    public static async passwordDelete(context: ExtensionContext, name: string) {
        await context.secrets.delete(ERP_HELPER + name);
    }

    public static async accessTokenSave(context: ExtensionContext, name: string, password: string) {
        await context.secrets.store(ERP_HELPER_TOKEN + name, password);
    }

    public static async accessTokenGet(context: ExtensionContext, name: string) {
        return await context.secrets.get(ERP_HELPER_TOKEN + name) as string;
    }

    public static async accessTokenDelete(context: ExtensionContext, name: string) {
        await context.secrets.delete(ERP_HELPER_TOKEN + name);
    }    

    public static async connectionList() {
        return await vscode.workspace.getConfiguration().get(CONNECTION_LIST) as Array<Connection>;
    }

    public static async connectionSelected() {
        return await vscode.workspace.getConfiguration().get(CONNECTION_SELECTED);
    }

    public static async connectionSelectedSave(name: string) {
        await vscode.workspace.getConfiguration().update(CONNECTION_SELECTED, name, true);
    }

    public static async connectionListSave(connections: Array<Connection>) {
        await vscode.workspace.getConfiguration().update(CONNECTION_LIST, connections, true);  
    }

    public static async currentConnection(context: ExtensionContext): Promise<Connection> {
        let conn = new Connection();
        let conns = await ConnectionUtils.connectionList();
        const connectionSelected = await ConnectionUtils.connectionSelected();
        conns = conns.filter(item => item.name === connectionSelected);
        if (conns.length > 0) {
            conn = conns[0];
            conn.password = await ConnectionUtils.passwordGet(context, conn.name);
            conn.accessToken = await ConnectionUtils.accessTokenGet(context, conn.name);
        }

        return conn;
    }
}