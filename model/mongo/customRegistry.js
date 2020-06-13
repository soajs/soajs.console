/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "custom_registry";
const core = require("soajs");
const access = require("./access");
const Mongo = core.mongo;

let indexing = {};

function CustomRegistry(service, options, mongoCore) {
	let __self = this;
	if (__self.log) {
		__self.log = service.log;
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
			
			__self.mongoCore.createIndex(colName, {'created': 1}, {}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			__self.mongoCore.createIndex(colName, {'name': 1}, {"unique": 1}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			
			service.log.debug("customRegistry: Indexes for " + index + " Updated!");
		}
	}
}

CustomRegistry.prototype.add = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.data || !data.data.name || !data.data.value) {
		let error = new Error("CustomRegistry: env and data(name, value) are required.");
		return cb(error, null);
	}
	
	let options = {};
	let doc = {
		"name": data.data.name,
		"plugged": !!data.data.plugged,
		"shared": !!data.data.shared,
		"value": data.data.value,
		"sharedEnv": data.data.sharedEnv || null,
		"created": data.env.toUpperCase()
	};
	let versioning = false;
	
	__self.mongoCore.insertOne(colName, doc, options, versioning, cb);
};

CustomRegistry.prototype.update = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.data || !data.data.name || !data.data.value) {
		let error = new Error("CustomRegistry: id, name, value are required.");
		return cb(error, null);
	}
	__self.validateId(data.id, (error, _id) => {
		if (error) {
			return cb(error);
		}
		let condition = {
			_id: _id
		};
		
		let options = {};
		let fields = {
			'$set': {
				"name": data.data.name,
				"plugged": !!data.data.plugged,
				"shared": !!data.data.shared,
				"value": data.data.value
			}
		};
		if (data.data.sharedEnv) {
			fields.$set.sharedEnv = data.data.sharedEnv;
		}
		__self.check_if_can_access(data, condition, {}, (error) => {
			if (error) {
				return cb(error);
			}
			__self.mongoCore.updateOne(colName, condition, fields, options, (err, record) => {
				if (err) {
					return cb(err);
				}
				if (!record || (record && !record.nModified)) {
					let error = new Error("CustomRegistry: [" + data.id + "] was not updated.");
					return cb(error);
				}
				return cb(null, record.nModified);
			});
		});
	});
};

CustomRegistry.prototype.get = function (data, cb) {
	let __self = this;
	if (!data || !data.env) {
		let error = new Error("customRegistry: env is required.");
		return cb(error, null);
	}
	let condition = {
		created: data.env.toUpperCase()
	};
	condition = access.add_acl_2_condition(data, condition);
	let options = {};
	__self.mongoCore.find(colName, condition, options, cb);
};

CustomRegistry.prototype.delete = function (data, cb) {
	let __self = this;
	if (!data || !data.id) {
		let error = new Error("customRegistry: id is required.");
		return cb(error, null);
	}
	__self.validateId(data.id, (error, _id) => {
		if (error) {
			return cb(error);
		}
		let condition = {
			_id: _id
		};
		let options = {};
		condition = access.add_acl_2_condition(data, condition);
		__self.mongoCore.deleteOne(colName, condition, options, cb);
	});
};

CustomRegistry.prototype.update_acl = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.type || !data.groups) {
		let error = new Error("customRegistry: id, type and groups are required.");
		return cb(error, null);
	}
	let allowedTypes = ["blacklist", "whitelist"];
	if (!allowedTypes.includes(data.type)) {
		let error = new Error("customRegistry: type can only be one of the following: " + allowedTypes.join(","));
		return cb(error, null);
	}
	if (!Array.isArray(data.groups)) {
		let error = new Error("customRegistry: groups must be an array.");
		return cb(error, null);
	}
	__self.validateId(data.id, (err, _id) => {
		if (err) {
			return cb(err, null);
		}
		
		let condition = {"_id": _id};
		
		let s = {
			'$set': {
				"settings.acl.groups.value": data.groups,
				"settings.acl.groups.type": data.type,
				"settings.acl.groups.config": data.config || {}
			}
		};
		__self.check_if_can_access(data, condition, {}, (error) => {
			if (error) {
				return cb(error);
			}
			__self.mongoCore.updateOne(colName, condition, s, null, (err, record) => {
				if (err) {
					return cb(err);
				}
				if (!record || (record && !record.nModified)) {
					let error = new Error("customRegistry: [" + data.id + "] was not updated.");
					return cb(error);
				}
				return cb(null, record.nModified);
			});
		});
	});
};

CustomRegistry.prototype.check_if_can_access = function (data, condition, options, cb) {
	let __self = this;
	__self.mongoCore.findOne(colName, condition, options, (err, item) => {
		if (err) {
			return cb(err, null);
		}
		if (!item) {
			let error = new Error("CustomRegistry: item not found.");
			return cb(error, null);
		}
		access.check_can_access(data, item, cb);
	});
};

CustomRegistry.prototype.validateId = function (id, cb) {
	let __self = this;
	
	if (!id) {
		let error = new Error("customRegistry: must provide an id.");
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

CustomRegistry.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = CustomRegistry;