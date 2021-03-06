/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "environment";
const core = require("soajs");
const access = require("./access");
const Mongo = core.mongo;

let indexing = {};

function Environment(service, options, mongoCore) {
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
			
			__self.mongoCore.createIndex(colName, {'code': 1}, {unique: true}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			
			service.log.debug("Environment: Indexes for " + index + " Updated!");
		}
	}
}

Environment.prototype.add = function (data, cb) {
	let __self = this;
	if (!data || !data.code) {
		let error = new Error("Environment: code is required.");
		return cb(error, null);
	}
	let options = {};
	let versioning = false;
	__self.mongoCore.insertOne(colName, data, options, versioning, cb);
};

Environment.prototype.get = function (data, cb) {
	let __self = this;
	
	let options = {
		"projection": {code: 1, description: 1, deployer: 1, locked: 1}
	};
	if (data.noProjection) {
		delete options.projection;
	}
	if (data.code) {
		let condition = {
			code: data.code
		};
		condition = access.add_acl_2_condition(data, condition);
		__self.mongoCore.findOne(colName, condition, options, cb);
	} else if (data.id) {
		__self.validateId(data.id, (error, _id) => {
			if (error) {
				return cb(error);
			}
			let condition = {
				_id: _id
			};
			condition = access.add_acl_2_condition(data, condition);
			__self.mongoCore.findOne(colName, condition, options, cb);
		});
	} else {
		let condition = {};
		condition = access.add_acl_2_condition(data, condition);
		__self.mongoCore.find(colName, condition, options, cb);
	}
};

Environment.prototype.getSettings = function (data, cb) {
	let __self = this;
	if (!data || !data.code) {
		let error = new Error("Environment: code is required.");
		return cb(error, null);
	}
	
	let options = {
		"projection": {code: 1, description: 1, settings: 1}
	};
	if (data.noProjection) {
		delete options.projection;
	}
	let condition = {
		code: data.code
	};
	condition = access.add_acl_2_condition(data, condition);
	__self.mongoCore.findOne(colName, condition, options, cb);
};

Environment.prototype.get_portUsage = function (data, cb) {
	let __self = this;
	if (!data || !(data.port)) {
		let error = new Error("Environment: (port) is required.");
		return cb(error, null);
	}
	
	let options = {};
	let condition = {
		"services.config.ports.controller": data.port
	};
	condition = access.add_acl_2_condition(data, condition);
	__self.mongoCore.countDocuments(colName, condition, options, cb);
	
};

Environment.prototype.delete = function (data, cb) {
	let __self = this;
	if (!data || !(data.code || data.id)) {
		let error = new Error("Environment: (code or id) is required.");
		return cb(error, null);
	}
	let options = {};
	if (data.code) {
		let condition = {
			code: data.code
		};
		condition = access.add_acl_2_condition(data, condition);
		__self.mongoCore.deleteOne(colName, condition, options, cb);
	} else if (data.id) {
		__self.validateId(data.id, (error, _id) => {
			if (error) {
				return cb(error);
			}
			let condition = {
				_id: _id
			};
			condition = access.add_acl_2_condition(data, condition);
			__self.mongoCore.deleteOne(colName, condition, options, cb);
		});
	}
};

Environment.prototype.update = function (data, cb) {
	let __self = this;
	if (!data || !data.code) {
		let error = new Error("Environment: code is required.");
		return cb(error, null);
	}
	
	let condition = {"code": data.code};
	
	let options = {};
	let fields = {
		'$set': {}
	};
	if (data.description) {
		fields.$set.description = data.description;
	}
	if (data.settings) {
		let defaultLocation = "deployer.container.kubernetes.namespace";
		if (data.depSeleted) {
			defaultLocation = data.depSeleted;
		}
		fields.$set[defaultLocation] = data.settings.namespace;
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
				let error = new Error("Environment: [" + data.code + "] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Environment.prototype.update_acl = function (data, cb) {
	let __self = this;
	if (!data || !data.code || !data.type || !data.groups) {
		let error = new Error("Environment: code, type and groups are required.");
		return cb(error, null);
	}
	let allowedTypes = ["blacklist", "whitelist"];
	if (!allowedTypes.includes(data.type)) {
		let error = new Error("Environment: type can only be one of the following: " + allowedTypes.join(","));
		return cb(error, null);
	}
	if (!Array.isArray(data.groups)) {
		let error = new Error("Environment: groups must be an array.");
		return cb(error, null);
	}
	
	let condition = {"code": data.code};
	
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
				let error = new Error("Environment: [" + data.code + "] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Environment.prototype.delete_acl = function (data, cb) {
	let __self = this;
	if (!data || !data.code) {
		let error = new Error("Environment: code is required.");
		return cb(error, null);
	}
	
	let condition = {"code": data.code};
	
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
				let error = new Error("Environment: [" + data.code + "] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Environment.prototype.check_if_can_access = function (data, condition, options, cb) {
	let __self = this;
	__self.mongoCore.findOne(colName, condition, options, (err, item) => {
		if (err) {
			return cb(err, null);
		}
		if (!item) {
			let error = new Error("Environment: item not found.");
			return cb(error, null);
		}
		access.check_can_access(data, item, cb);
	});
};

Environment.prototype.validateId = function (id, cb) {
	let __self = this;
	
	if (!id) {
		let error = new Error("Environment: must provide an id.");
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

Environment.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Environment;
