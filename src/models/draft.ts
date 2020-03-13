import File from './file';
import Message from './message';
import Contact from './contact';
import Attributes from './attributes';

export default class Draft extends Message {
  rawMime?: string;
  replyToMessageId?: string;
  version?: number;

  constructor(...args) {
    super(...args);
  }

  toJSON() {
    if (this.rawMime) {
      throw Error('toJSON() cannot be called for raw MIME drafts');
    }
    const json = super.toJSON(...arguments);
    json.file_ids = this.fileIds();
    if (this.draft) {
      json.object = 'draft';
    }

    return json;
  }

  save(params: { [key: string]: any } = {}, callback = null) {
    if (this.rawMime) {
      const err = new Error('save() cannot be called for raw MIME drafts');
      if (callback) {
        callback(err);
      }
      return Promise.reject(err);
    }
    return this._save(params, callback);
  }

  saveRequestBody() {
    if (this.rawMime) {
      throw Error('saveRequestBody() cannot be called for raw MIME drafts');
    }
    return super.saveRequestBody(...arguments);
  }

  deleteRequestBody(params: { [key: string]: any } = {}) {
    var body = {};
    body.version = params.hasOwnProperty('version')
      ? params.version
      : this.version;
    return body;
  }

  toString() {
    if (this.rawMime) {
      throw Error('toString() cannot be called for raw MIME drafts');
    }
    return super.toString();
  }

  send(callback?: () => void = null, tracking?: { [key: string]: any }) {
    let body = this.rawMime,
      headers = { 'Content-Type': 'message/rfc822' },
      json = false;

    if (!this.rawMime) {
      headers = {};
      json = true;
      if (this.id) {
        body = {
          draft_id: this.id,
          version: this.version,
        };
      } else {
        body = this.saveRequestBody();
        if (tracking) {
          body['tracking'] = tracking;
        }
      }
    }

    return this.connection
      .request({
        method: 'POST',
        path: '/send',
        headers,
        body,
        json,
      })
      .then(json => {
        const message = new Message(this.connection, json);

        // We may get failures for a partial send
        if (json.failures) {
          message.failures = json.failures;
        }

        if (callback) {
          callback(null, message);
        }
        return Promise.resolve(message);
      })
      .catch(err => {
        if (callback) {
          callback(err);
        }
        return Promise.reject(err);
      });
  }
}
Draft.collectionName = 'drafts';
Draft.attributes = {
  ...Message.attributes,
  version: Attributes.Number({
    modelKey: 'version',
  }),
  replyToMessageId: Attributes.String({
    modelKey: 'replyToMessageId',
    jsonKey: 'reply_to_message_id',
  }),
};
