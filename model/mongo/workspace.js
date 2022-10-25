/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "workspace";
const core = require("soajs");
const Mongo = core.mongo;

let indexing = {};

function Workspace(service, options, mongoCore) {
    let __self = this;
    if (service.log && service.log.error) {
        __self.log = service.log.error;
    } else {
        __self.log = (log) => {
            console.log(log);
        };
    }

    if (mongoCore) {
        __self.mongoCore = mongoCore;
    }
    if (!__self.mongoCore) {
        if (options && options.dbConfig) {
            __self.mongoCore = new Mongo(options.dbConfig);
        } else {
            let registry = service.registry.get();
            __self.mongoCore = new Mongo(registry.coreDB.provision);
        }

        let index = "default";
        if (options && options.index) {
            index = options.index;
        }
        if (indexing && !indexing[index]) {
            indexing[index] = true;


            service.log.debug("Workspace: Indexes for " + index + " Updated!");
        }
    }
}

Workspace.prototype.listCollections = function (data, cb) {
    let __self = this;
    let pipeline = [
        {
            $match: {
                "env": data.env
            }
        }
    ];
    __self.mongoCore.aggregate(colName, pipeline, {}, (err, cursor) => {
        if (err) {
            return cb(err, null);
        } else {
            cursor.toArray((err, response) => {
                if (response && Array.isArray(response)) {
                    response = response[0];
                }
                return cb(err, response);
            });
        }
    });
};

Workspace.prototype.deleteCollection = function (data, cb) {
    let __self = this;
    if (!data || !data.id) {
        let error = new Error("Workspace: id is required.");
        return cb(error, null);
    }

    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }
        let condition = {
            "_id": _id
        };

        let updatedAt = new Date().getTime();
        let s = {
            '$set': {
                "time.updatedAt": updatedAt,
                "status": "deleted"
            }
        };
        __self.mongoCore.updateOne(colName, condition, s, null, (error, response) => {
            if (error) {
                return cb(error);
            }
            return cb(null, response ? response.nModified : 0);
        });
    });
};

Workspace.prototype.deleteCollectionApi = function (data, cb) {
    let __self = this;
    if (!data || !data.id || !data.apiId) {
        let error = new Error("Workspace: id and apiId are required.");
        return cb(error, null);
    }
    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }

        let condition = {
            "_id": _id
        };
        let s = { "$pull": { "apis": { "_id": data.apiId } } };
        __self.mongoCore.updateOne(colName, condition, s, null, (error, response) => {
            if (error) {
                return cb(error);
            }
            return cb(null, response ? response.nModified : 0);
        });
    });
};

Workspace.prototype.updateCollection = function (data, cb) {
    let __self = this;
    if (!data || !data.id) {
        let error = new Error("Workspace: id is required.");
        return cb(error, null);
    }

    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }
        let condition = {
            "_id": _id
        };

        let updatedAt = new Date().getTime();
        let s = {
            '$set': {
                "time.updatedAt": updatedAt,
                "name": data.name,
                "description": data.description
            }
        };
        __self.mongoCore.updateOne(colName, condition, s, null, (error, response) => {
            if (error) {
                return cb(error);
            }
            return cb(null, response ? response.nModified : 0);
        });
    });
};

Workspace.prototype.updateCollectionApis = function (data, cb) {
    let __self = this;
    if (!data || !data.id || !data.apis) {
        let error = new Error("Workspace: id and apis are required.");
        return cb(error, null);
    }

    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }
        let condition = {
            "_id": _id
        };

        let updatedAt = new Date().getTime();
        let s = {
            '$set': {
                "time.updatedAt": updatedAt,
                "apis": data.apis
            }
        };
        __self.mongoCore.updateOne(colName, condition, s, null, (error, response) => {
            if (error) {
                return cb(error);
            }
            return cb(null, response ? response.nModified : 0);
        });
    });
};

Workspace.prototype.updateCollectionApi = function (data, cb) {
    let __self = this;
    if (!data || !data.id || !data.apiId || !data.method || !data.name || !data.api) {
        let error = new Error("Workspace: id, apiId, method, name and api are required.");
        return cb(error, null);
    }
    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }

        let updatedAt = new Date().getTime();
        let condition = {
            "_id": _id,
            "apis._id": data.apiId
        };
        let s = {
            '$set': {
            }
        };
        s.$set["apis.$.time.updatedAt"] = updatedAt;
        s.$set["apis.$.method"] = data.method;
        s.$set["apis.$.name"] = data.name;
        s.$set["apis.$.api"] = data.api;

        if (data.headers) {
            s.$set["apis.$.headers"] = data.headers;
        }
        if (data.body) {
            s.$set["apis.$.body"] = data.body;
        }
        if (data.query) {
            s.$set["apis.$.query"] = data.query;
        }
        __self.mongoCore.updateOne(colName, condition, s, null, (error, response) => {
            if (error) {
                return cb(error);
            }
            return cb(null, response ? response.nModified : 0);
        });
    });
};

Workspace.prototype.addCollection = function (data, cb) {
    let __self = this;
    if (!data || !data.tenantId || !data.addedBy || !data.name || !data.description || !data.env) {
        let error = new Error("Workspace: tenantId, addedBy, name, description and env are required.");
        return cb(error, null);
    }
    let options = {};
    let doc = {
        "tenantId": data.tenantId,
        "userId": data.addedBy,
        "name": data.name,
        "description": data.description,
        "env": data.env,
        "status": "active",
        "time": {
            "createdAt": new Date().getTime()
        }
    };

    __self.mongoCore.insertOne(colName, doc, options, (error, response) => {
        if (error) {
            return cb(error, null);
        }
        return cb(null, response);
    });
};

Workspace.prototype.addCollectionApi = function (data, cb) {
    let __self = this;
    if (!data || !data.id) {
        let error = new Error("Workspace: id is required.");
        return cb(error, null);
    }
    __self.validateId(data.id, (error, _id) => {
        if (error) {
            return cb(error);
        }
        const condition = {
            "_id": _id,
            "tenantId": data.tenantId
        };

        let options = {};

        const doc = {
            "_id": __self.generateId().toString(),
            "method": data.method,
            "name": data.name,
            "api": data.api,
            "headers": data.headers,
            "body": data.body,
            "query": data.query,
            "time": {
                "createdAt": new Date().getTime()
            }
        };
        const set = {
            $addToSet: {
                apis: doc
            }
        };

        __self.mongoCore.updateOne(colName, condition, set, options, (error, response) => {
            return cb(error, response ? { "_id": doc._id } : null);
        });
    });
};

Workspace.prototype.generateId = function () {
    let __self = this;
    return __self.mongoCore.ObjectId();
};

Workspace.prototype.validateId = function (id, cb) {
    let __self = this;

    if (!id) {
        let error = new Error("Must provide an id.");
        return cb(error, null);
    }

    try {
        id = __self.mongoCore.ObjectId(id);
        return cb(null, id);
    } catch (e) {
        __self.log(e.message);
        return cb(new Error("A valid ID is required"), null);
    }
};

Workspace.prototype.closeConnection = function () {
    let __self = this;
    __self.mongoCore.closeDb();
};

module.exports = Workspace;