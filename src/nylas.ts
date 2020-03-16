import request from 'request';

import NylasConnection from './nylas-connection';
import ManagementAccount from './models/management-account';
import Account from './models/account';
import Connect from './models/connect';
import RestfulModelCollection from './models/restful-model-collection';
import ManagementModelCollection from './models/management-model-collection';
import Webhook from './models/webhook';

class Nylas {
  clientId?: string | null = null;
  clientSecret?: string | null = null;
  apiServer?: string | null = null;

  constructor() {
    this.clientId = null;
    this.clientSecret = null;
  }

  static config({
    clientId,
    clientSecret,
    apiServer,
    appId,
    appSecret
  } : {
    clientId: string,
    clientSecret: string,
    apiServer:string,
    appId?: string,
    appSecret?: string
  }) {
    if (apiServer && apiServer.indexOf('://') === -1) {
      throw new Error(
        'Please specify a fully qualified URL for the API Server.'
      );
    }

    if (appId) {
      this.clientId = appId;
      process.emitWarning(
        '"appId" will be deprecated in version 5.0.0. Use "clientId" instead.',
        {
          code: 'Nylas',
          type: 'DeprecationWarning',
        }
      );
    }

    if (appSecret) {
      this.clientSecret = appSecret;
      process.emitWarning(
        '"appSecret" will be deprecated in version 5.0.0. Use "clientSecret" instead.',
        {
          code: 'Nylas',
          type: 'DeprecationWarning',
        }
      );
    }

    if (clientId) {
      this.clientId = clientId;
    }
    if (clientSecret) {
      this.clientSecret = clientSecret;
    }
    if (apiServer) {
      this.apiServer = apiServer;
    } else {
      this.apiServer = 'https://api.nylas.com'
    }

    const conn = new NylasConnection(this.clientSecret, {
      clientId: this.clientId,
    });
    this.connect = new Connect(conn, this.clientId, this.clientSecret);
    this.webhooks = new ManagementModelCollection(Webhook, conn, this.clientId);
    if (this.clientCredentials()) {
      this.accounts = new ManagementModelCollection(
        ManagementAccount,
        conn,
        this.clientId
      );
    } else {
      this.accounts = new RestfulModelCollection(Account, conn, this.clientId);
    }

    return this;
  }

  static get appId() {
    process.emitWarning(
      '"appId" will be deprecated in version 5.0.0. Use "clientId" instead.',
      {
        code: 'Nylas',
        type: 'DeprecationWarning',
      }
    );
    return this.clientId;
  }

  static set appId(value: string) {
    this.clientId = value;
    process.emitWarning(
      '"appId" will be deprecated in version 5.0.0. Use "clientId" instead.',
      {
        code: 'Nylas',
        type: 'DeprecationWarning',
      }
    );
  }

  static get appSecret() {
    process.emitWarning(
      '"appSecret" will be deprecated in version 5.0.0. Use "clientSecret" instead.',
      {
        code: 'Nylas',
        type: 'DeprecationWarning',
      }
    );
    return this.clientSecret;
  }

  static set appSecret(value: string) {
    this.clientSecret = value;
    process.emitWarning(
      '"appSecret" will be deprecated in version 5.0.0. Use "clientSecret" instead.',
      {
        code: 'Nylas',
        type: 'DeprecationWarning',
      }
    );
  }

  static clientCredentials() {
    return this.clientId != null && this.clientSecret != null;
  }

  static with(accessToken: string) {
    if (!accessToken) {
      throw new Error('This function requires an access token');
    }
    return new NylasConnection(accessToken, { clientId: this.clientId });
  }

  static exchangeCodeForToken(code: string, callback?: () => void) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'exchangeCodeForToken() cannot be called until you provide a clientId and secret via config()'
      );
    }
    if (!code) {
      throw new Error('exchangeCodeForToken() must be called with a code');
    }

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        json: true,
        url: `${this.apiServer}/oauth/token`,
        qs: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
        },
      };

      return request(options, (error, response, body) => {
        if (error) {
          reject(error);
          if (callback) {
            return callback(error);
          }
        } else {
          resolve(body['access_token']);
          if (callback) {
            return callback(null, body['access_token']);
          }
        }
      });
    });
  }

  static urlForAuthentication(options: { [key: string]: any } = {}) {
    if (!this.clientId) {
      throw new Error(
        'urlForAuthentication() cannot be called until you provide a clientId via config()'
      );
    }
    if (!options.redirectURI) {
      throw new Error('urlForAuthentication() requires options.redirectURI');
    }
    if (!options.loginHint) {
      options.loginHint = '';
    }
    let url = `${this.apiServer}/oauth/authorize?client_id=${this.clientId}&response_type=code&login_hint=${options.loginHint}&redirect_uri=${options.redirectURI}`;
    if (options.state != null) {
      url += `&state=${options.state}`;
    }
    if (options.scopes != null) {
      url += `&scopes=${options.scopes.join(',')}`;
    }
    return url;
  }
}

// We keep the old `module.exports` syntax for now to ensure that people using
// `require` don't have to use `.default` to use this package
module.exports = Nylas;
