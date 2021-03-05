/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "resources";
const core = require("soajs");
const access = require("./access");
const Mongo = core.mongo;

let indexing = {};

function Resource(service, options, mongoCore) {
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
			
			__self.mongoCore.createIndex(colName, {'created': 1}, {}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			__self.mongoCore.createIndex(colName, {'name': 1, 'created': 1}, {"unique": 1}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			
			service.log.debug("Resource: Indexes for " + index + " Updated!");
		}
	}
}

Resource.prototype.add = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.data || !data.data.name || !data.data.config || !data.data.type || !data.data.category) {
		let error = new Error("Resource: env and data(name, config, type, category) are required.");
		return cb(error, null);
	}
	
	let options = {};
	let doc = {
		"name": data.data.name,
		"plugged": !!data.data.plugged,
		"shared": !!data.data.shared,
		"config": data.data.config,
		"created": data.env.toUpperCase(),
		"type": data.data.type,
		"category": data.data.category
	};
	if (data.data.sharedEnvs) {
		doc.sharedEnvs = data.data.sharedEnvs;
	}
	let versioning = false;
	
	__self.mongoCore.insertOne(colName, doc, options, versioning, cb);
};

Resource.prototype.update = function (data, cb) {
	let __self = this;
	if (!data || !data.id || (!data.data && !data.data.name && !data.data.config && !data.data.hasOwnProperty("plugged") && !data.data.hasOwnProperty("shared") && !data.data.sharedEnvs && !data.data.type && !data.data.category)) {
		let error = new Error("Resource: id, and (name, config, plugged, shared, sharedEnvs, type, or category) are required.");
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
			'$set': {}
		};
		if (data.data.name) {
			fields.$set.name = data.data.name;
		}
		if (data.data.config) {
			fields.$set.config = data.data.config;
		}
		if (data.data.hasOwnProperty("plugged")) {
			fields.$set.plugged = !!data.data.plugged;
		}
		if (data.data.hasOwnProperty("shared")) {
			fields.$set.shared = !!data.data.shared;
		}
		if (data.data.sharedEnvs) {
			fields.$set.sharedEnvs = data.data.sharedEnvs;
		}
		if (data.data.type) {
			fields.$set.type = data.data.type;
		}
		if (data.data.category) {
			fields.$set.category = data.data.category;
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
					let error = new Error("Resource: [" + data.id + "] was not updated.");
					return cb(error);
				}
				return cb(null, record.nModified);
			});
		});
	});
};

Resource.prototype.get = function (data, cb) {
	let __self = this;
	if (!data || !data.env) {
		let error = new Error("Resource: env is required.");
		return cb(error, null);
	}
	// let condition = {
	// 	created: data.env.toUpperCase()
	// };
	let condition = {
		"$or": [
			{"created": data.env.toUpperCase()},
			{["sharedEnvs." + data.env.toUpperCase()]: true}
		]
	};
	if (data.type) {
		condition.$or[0].type = data.type;
	}
	
	condition = access.add_acl_2_condition(data, condition);
	let options = {};
	__self.mongoCore.find(colName, condition, options, cb);
};

Resource.prototype.delete = function (data, cb) {
	let __self = this;
	if (!data || !data.id) {
		let error = new Error("Resource: id is required.");
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

Resource.prototype.update_acl = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.type || !data.groups) {
		let error = new Error("Resource: id, type and groups are required.");
		return cb(error, null);
	}
	let allowedTypes = ["blacklist", "whitelist"];
	if (!allowedTypes.includes(data.type)) {
		let error = new Error("Resource: type can only be one of the following: " + allowedTypes.join(","));
		return cb(error, null);
	}
	if (!Array.isArray(data.groups)) {
		let error = new Error("Resource: groups must be an array.");
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
					let error = new Error("Resource: [" + data.id + "] was not updated.");
					return cb(error);
				}
				return cb(null, record.nModified);
			});
		});
	});
};

Resource.prototype.delete_acl = function (data, cb) {
	let __self = this;
	if (!data || !data.id) {
		let error = new Error("Resource: id is required.");
		return cb(error, null);
	}
	
	__self.validateId(data.id, (err, _id) => {
		if (err) {
			return cb(err, null);
		}
		
		let condition = {"_id": _id};
		
		
		let s = {
			'$set': {
				"settings.acl": {}
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
					let error = new Error("Resource: [" + data.id + "] was not updated.");
					return cb(error);
				}
				return cb(null, record.nModified);
			});
		});
	});
};

Resource.prototype.check_if_can_access = function (data, condition, options, cb) {
	let __self = this;
	__self.mongoCore.findOne(colName, condition, options, (err, item) => {
		if (err) {
			return cb(err, null);
		}
		if (!item) {
			let error = new Error("Resource: item not found.");
			return cb(error, null);
		}
		access.check_can_access(data, item, cb);
	});
};

Resource.prototype.validateId = function (id, cb) {
	let __self = this;
	
	if (!id) {
		let error = new Error("Resource: must provide an id.");
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

Resource.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Resource;
