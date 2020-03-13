import RestfulModel from "./restful-model";

// The Attribute class represents a single model attribute, like 'namespace_id'
// Subclasses of Attribute like AttributeDateTime know how to covert between
// the JSON representation of that type and the javascript representation.
// The Attribute class also exposes convenience methods for generating Matchers.

class Attribute {
  modelKey?: string;
  jsonKey?: string;

  constructor({ modelKey, jsonKey }) {
    this.modelKey = modelKey;
    this.jsonKey = jsonKey || modelKey;
  }

  toJSON(val: any) {
    return val;
  }
  fromJSON(val: any, parent: any) {
    return val || null;
  }
}

class AttributeNumber extends Attribute {
  toJSON(val: any) {
    return val;
  }
  fromJSON(val: any, parent: any) {
    if (!isNaN(val)) {
      return Number(val);
    } else {
      return null;
    }
  }
}

class AttributeBoolean extends Attribute {
  toJSON(val: any) {
    return val;
  }
  fromJSON(val: any, parent: any) {
    return val === 'true' || val === true || false;
  }
}

class AttributeString extends Attribute {
  toJSON(val: any) {
    return val;
  }
  fromJSON(val: any, parent: any) {
    return val || '';
  }
}

class AttributeStringList extends Attribute {
  toJSON(val: any) {
    return val;
  }
  fromJSON(val: any, parent: any) {
    return val || [];
  }
}

class AttributeDate extends Attribute {
  toJSON(val: any) {
    if (!val) {
      return val;
    }
    if (!(val instanceof Date)) {
      throw new Error(
        `Attempting to toJSON AttributeDate which is not a date:
          ${this.modelKey}
         = ${val}`
      );
    }
    return val.toISOString();
  }

  fromJSON(val: any, parent: any) {
    if (!val) {
      return null;
    }
    return new Date(val);
  }
}

class AttributeDateTime extends Attribute {
  toJSON(val: any) {
    if (!val) {
      return null;
    }
    if (!(val instanceof Date)) {
      throw new Error(
        `Attempting to toJSON AttributeDateTime which is not a date:
          ${this.modelKey}
        = ${val}`
      );
    }
    return val.getTime() / 1000.0;
  }

  fromJSON(val: any, parent: any) {
    if (!val) {
      return null;
    }
    return new Date(val * 1000);
  }
}

class AttributeCollection extends Attribute {
  itemClass?: RestfulModel;

  constructor({ modelKey, jsonKey, itemClass }) {
    super(...arguments);
    this.itemClass = itemClass;
  }

  toJSON(vals: any) {
    if (!vals) {
      return [];
    }
    const json = [];
    for (const val of vals) {
      if (val.toJSON != null) {
        json.push(val.toJSON());
      } else {
        json.push(val);
      }
    }
    return json;
  }

  fromJSON(json: any, parent: any) {
    if (!json || !(json instanceof Array)) {
      return [];
    }
    const objs = [];
    for (const objJSON of json) {
      const obj = new this.itemClass(parent.connection, objJSON);
      objs.push(obj);
    }
    return objs;
  }
}

module.exports = {
  Number() {
    return new AttributeNumber(...arguments);
  },
  String() {
    return new AttributeString(...arguments);
  },
  StringList() {
    return new AttributeStringList(...arguments);
  },
  DateTime() {
    return new AttributeDateTime(...arguments);
  },
  Date() {
    return new AttributeDate(...arguments);
  },
  Collection() {
    return new AttributeCollection(...arguments);
  },
  Boolean() {
    return new AttributeBoolean(...arguments);
  },
  Object() {
    return new Attribute(...arguments);
  },

  AttributeNumber,
  AttributeString,
  AttributeStringList,
  AttributeDateTime,
  AttributeCollection,
  AttributeBoolean,
  AttributeDate,
};
