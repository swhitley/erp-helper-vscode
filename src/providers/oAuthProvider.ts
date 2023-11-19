/* eslint-disable @typescript-eslint/naming-convention */
// Source: https://github.com/estruyf/vscode-auth-sample
import * as vscode from "vscode";
import { authentication, AuthenticationProvider, AuthenticationProviderAuthenticationSessionsChangeEvent, AuthenticationSession, Disposable, env, EventEmitter, ExtensionContext, ProgressLocation, Uri, UriHandler, window } from "vscode";
import { v4 as uuid } from 'uuid';
import { PromiseAdapter} from "../utilities/promiseAdapter";
import { promiseFromEvent } from "../utilities/promiseFromEvent";
import { Connection, ConnectionUtils } from "../utilities/connection";
import axios from "axios";

export const AUTH_TYPE = `workday`;
const AUTH_NAME = `Workday`;

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
	public handleUri(uri: Uri) {
		this.fire(uri);
	}
}

export class OAuthProvider implements AuthenticationProvider, Disposable {
	private _sessionChangeEmitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  private _disposable: Disposable;
  private _pendingStates: string[] = [];
  private _codeExchangePromises = new Map<string, { promise: Promise<string>; cancel: EventEmitter<void> }>();
  private _uriHandler = new UriEventHandler();
  private _codeVerifier: string = "";
  private _connection: Connection = new Connection();
  
  constructor(private readonly context: ExtensionContext) {
    this._disposable = Disposable.from(
      authentication.registerAuthenticationProvider(AUTH_TYPE, AUTH_NAME, this, { supportsMultipleAccounts: false }),
      window.registerUriHandler(this._uriHandler)
    );
  }

	get onDidChangeSessions() {
		return this._sessionChangeEmitter.event;
	}

  get redirectUri() {
    const publisher = this.context.extension.packageJSON.publisher;
    const name = this.context.extension.packageJSON.name;
    return `${env.uriScheme}://${publisher}.${name}`;
  }

  /**
   * Get the existing sessions
   * @param scopes 
   * @returns 
   */
  public async getSessions(scopes?: string[]): Promise<readonly AuthenticationSession[]> {
    scopes = scopes;
    return [];
  }

  /**
   * Create a new auth session
   * @param scopes 
   * @returns 
   */
  public async createSession(scopes: string[]): Promise<AuthenticationSession> {
    try {
      this._connection = JSON.parse(scopes[0]);
      scopes = [];
      const token = await this.login(scopes, this._connection);
      if (!token) {
        throw new Error(`Login failure`);
      }

      const session: AuthenticationSession = {
        id: uuid(),
        accessToken: token,
        account: {
          label: '',
          id: ''
        },
        scopes: []
      };

      return session;
    } catch (e) {
      window.showErrorMessage(`Sign in failed: ${e}`);
			throw e;
    }
  }

  /**
   * Remove an existing session
   * @param sessionId 
   */
  public async removeSession(sessionId: string): Promise<void> {
    sessionId = sessionId;
    //
  }

  /**
   * Dispose the registered services
   */
	public async dispose() {
		this._disposable.dispose();
	}

  /**
   * Log in using OAuth
   */
  //private async login(scopes: string[] = []) {
  private async login(scopes: string[] = [], api: Connection) {
    return await window.withProgress<string>({
			location: ProgressLocation.Notification,
			title: "Signing in...",
			cancellable: true
		}, async (_, token) => {
      const stateId = uuid();

      this._pendingStates.push(stateId);

      const scopeString = scopes.join(' ');

      // Code Verifier
      const randomstring = require("randomstring");
      const crypto = require("crypto");
      const base64url = require("base64url");      
      this._codeVerifier = randomstring.generate(128); 
      
      const base64Digest = crypto
        .createHash("sha256")
        .update(this._codeVerifier)
        .digest("base64");
      
      const codeChallenge = base64url.fromBase64(base64Digest);      

      const searchParams = new URLSearchParams([
        ['response_type', "code"],
        ['client_id', api.clientId],
        ['code_challenge_method', "S256"],
        ['code_challenge', codeChallenge],
        ['state', stateId],
      ]);
      const uri = Uri.parse(api.authEndpoint + `?${searchParams.toString()}`);
      await env.openExternal(uri);

      let codeExchangePromise = this._codeExchangePromises.get(scopeString);
      if (!codeExchangePromise) {
        codeExchangePromise = promiseFromEvent(this._uriHandler.event, this.handleUri(scopes));
        this._codeExchangePromises.set(scopeString, codeExchangePromise);
      }

     try {
        return await Promise.race([
          codeExchangePromise.promise,
          new Promise<string>((_, reject) => setTimeout(() => reject('Cancelled'), 60000)),
          promiseFromEvent<any, any>(token.onCancellationRequested, (_:any, __:any, reject:any) => { reject('User Cancelled'); }).promise
        ]);
      } finally {
        this._pendingStates = this._pendingStates.filter(n => n !== stateId);
        codeExchangePromise?.cancel.fire();
        this._codeExchangePromises.delete(scopeString);
      }
    });
  }

  /**
   * Handle the redirect to VS Code (after sign in from OAuth)
   * @param scopes 
   * @returns 
   */
  private handleUri: (scopes: readonly string[]) => PromiseAdapter<Uri, string> = 
  (scopes) => async (uri:any, resolve:any, reject:any) => {
    scopes = scopes;
    const query = new URLSearchParams(uri.query);
    const authToken = query.get('code');
    const state = query.get('state');

    if (!authToken) {
      reject(new Error('No token'));
      return;
    }
    if (!state) {
      reject(new Error('No state'));
      return;
    }

    // Check if it is a valid auth request started by the extension
    if (!this._pendingStates.some(n => n === state)) {
      reject(new Error('State not found'));
      return;
    }

    const access = await this.getAccessToken(authToken, this._connection);

    resolve(access.access_token);
  };

  /**
   * Get the user info from OAUTH
   * @param token 
   * @returns 
   */
  private async getAccessToken(token: string, api: typeof this._connection) {

    var options = {
      method: 'POST',
      url: api.tokenEndpoint,
      headers: {"content-type": 'application/x-www-form-urlencoded'},
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: api.clientId,
        code_verifier: this._codeVerifier,
        code: token,
        redirect_uri: this.redirectUri
      })
    };
    
    let accessToken = "";
    await axios.request(options).then(function (response) {
      accessToken = response.data.access_token;
    });

    return {access_token: accessToken};

  }
}