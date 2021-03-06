import ManagementModel from './management-model';
import Attributes from './attributes';

export default class Webhook extends ManagementModel {
  pathPrefix() {
    return `/a/${this.clientId}`;
  }
  saveRequestBody() {
    const json = {};
    // We can only update the state of an existing webhook
    if (this.id) {
      json['state'] = this.state;
    } else {
      json['callback_url'] = this.callbackUrl;
      json['state'] = this.state ? this.state : 'active';
      json['triggers'] = this.constructor.attributes.triggers.toJSON(
        this.triggers
      );
    }
    return json;
  }
  save(params = {}, callback = null) {
    return this._save(params, callback);
  }
  toJSON() {
    const json = super.toJSON(...arguments);
    delete json['object'];
    return json;
  }
}

Webhook.collectionName = 'webhooks';
Webhook.attributes = {
  id: Attributes.String({
    modelKey: 'id',
  }),

  applicationId: Attributes.String({
    modelKey: 'applicationId',
    jsonKey: 'application_id',
  }),

  callbackUrl: Attributes.String({
    modelKey: 'callbackUrl',
    jsonKey: 'callback_url',
  }),

  state: Attributes.String({
    modelKey: 'state',
  }),

  triggers: Attributes.StringList({
    modelKey: 'triggers',
  }),

  version: Attributes.String({
    modelKey: 'version',
  }),
};
