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

function Registry(service, options, mongoCore) {
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
			
			service.log.debug("Registry: Indexes for " + index + " Updated!");
		}
	}
}

Registry.prototype.get = function (data, cb) {
	let __self = this;
	if (!data || !data.env) {
		let error = new Error("Registry: env is required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	condition = access.add_acl_2_condition(data, condition);
	let options = {};
	__self.mongoCore.findOne(colName, condition, options, cb);
};

Registry.prototype.deleteDB = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.name) {
		let error = new Error("Registry: env, name are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	condition = access.add_acl_2_condition(data, condition);
	let s = {"$unset": {}};
	s.$unset["dbs.databases." + data.name] = 1;
	__self.mongoCore.updateOne(colName, condition, s, null, (err, record) => {
		if (err) {
			return cb(err);
		}
		if (!record || (record && !record.nModified)) {
			let error = new Error("Registry: [" + data.env + ", db " + data.name + "] was not deleted.");
			return cb(error);
		}
		return cb(null, record.nModified);
	});
};

Registry.prototype.deleteDBSession = function (data, cb) {
	let __self = this;
	if (!data || !data.env) {
		let error = new Error("Registry: env, name are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	condition = access.add_acl_2_condition(data, condition);
	let s = {"$unset": {}};
	s.$unset["dbs.session"] = 1;
	__self.mongoCore.updateOne(colName, condition, s, null, (err, record) => {
		if (err) {
			return cb(err);
		}
		if (!record || (record && !record.nModified)) {
			let error = new Error("Registry: [" + data.env + ", db session] was not deleted.");
			return cb(error);
		}
		return cb(null, record.nModified);
	});
};

Registry.prototype.addDB = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.name || !data.cluster) {
		let error = new Error("Registry: env, name, cluster are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {
		"$set": {
			["dbs.databases." + data.name]: {
				"cluster": data.cluster,
				"tenantSpecific": data.tenantSpecific || false
			}
		}
	};
	if (data.prefix) {
		s.$set["dbs.databases." + data.name].prefix = data.prefix;
	}
	__self.check_if_can_access(data, condition, {}, (error) => {
		if (error) {
			return cb(error);
		}
		__self.mongoCore.updateOne(colName, condition, s, null, (err, record) => {
			if (err) {
				return cb(err);
			}
			if (!record || (record && !record.nModified)) {
				let error = new Error("Registry: [" + data.env + ", " + data.name + "] was not added.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.updateDBPrefix = function (data, cb) {
	let __self = this;
	if (!data || !data.env || (!data.prefix && data.prefix !== "")) {
		let error = new Error("Registry: env, prefix are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {
		"$set": {
			"dbs.config.prefix": data.prefix
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
				let error = new Error("Registry: [" + data.env + ", prefix] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.updateDBSession = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.name || !data.cluster || !data.store || !data.expireAfter || !data.collection || !data.stringify) {
		let error = new Error("Registry: env, name, cluster, store, expireAfter, collection, stringify are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {
		"$set": {
			"dbs.session": {
				"cluster": data.cluster,
				"name": data.name,
				"store": data.store,
				"collection": data.collection,
				"stringify": data.stringify,
				"expireAfter": data.expireAfter
			}
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
				let error = new Error("Registry: [" + data.env + ", db session] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.updateDB = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.name || !data.cluster) {
		let error = new Error("Registry: env, name, cluster are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {
		"$set": {
			["dbs.databases." + data.name]: {
				"cluster": data.cluster,
				"tenantSpecific": data.tenantSpecific || false,
				"prefix": data.prefix || null
			}
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
				let error = new Error("Registry: [" + data.env + ", db " + data.name + "] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.update = function (data, cb) {
	let __self = this;
	if (!data || !data.env) {
		let error = new Error("Registry: env is required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {"$set": {}};
	if (data.domain) {
		s.$set.domain = data.domain;
	}
	if (data.sitePrefix) {
		s.$set.sitePrefix = data.sitePrefix;
	}
	if (data.apiPrefix) {
		s.$set.apiPrefix = data.apiPrefix;
	}
	if (data.port) {
		s.$set.port = data.port;
	}
	if (data.protocol) {
		s.$set.protocol = data.protocol;
	}
	if (data.description) {
		s.$set.description = data.description;
	}
	if (data.services) {
		if (data.services.controller) {
			s.$set["services.controller"] = data.services.controller;
		}
		if (data.services.config) {
			if (data.services.config.awareness) {
				s.$set["services.config.awareness"] = data.services.config.awareness;
			}
			if (data.services.config.logger) {
				s.$set["services.config.logger"] = data.services.config.logger;
			}
			if (data.services.config.ports) {
				s.$set["services.config.ports"] = data.services.config.ports;
			}
			if (data.services.config.oauth) {
				s.$set["services.config.oauth.accessTokenLifetime"] = data.services.config.oauth.accessTokenLifetime;
				s.$set["services.config.oauth.refreshTokenLifetime"] = data.services.config.oauth.refreshTokenLifetime;
				s.$set["services.config.oauth.debug"] = data.services.config.oauth.debug;
				s.$set["services.config.oauth.getUserFromToken"] = data.services.config.oauth.getUserFromToken;
			}
			if (data.services.config.cors) {
				s.$set["services.config.cors"] = data.services.config.cors;
			}
		}
	}
	__self.check_if_can_access(data, condition, {}, (error) => {
		if (error) {
			return cb(error);
		}
		__self.mongoCore.updateOne(colName, condition, s, null, (err, record) => {
			if (err) {
				return cb(err);
			}
			if (!record || (record && !record.nModified)) {
				let error = new Error("Registry: [" + data.env + "] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.updateThrottling = function (data, cb) {
	let __self = this;
	if (!data || !data.env || !data.throttling) {
		let error = new Error("Registry: env, throttling are required.");
		return cb(error, null);
	}
	let condition = {
		code: data.env
	};
	let s = {
		"$set": {
			"services.config.throttling": data.throttling
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
				let error = new Error("Registry: [" + data.env + ", throttling] was not updated.");
				return cb(error);
			}
			return cb(null, record.nModified);
		});
	});
};

Registry.prototype.check_if_can_access = function (data, condition, options, cb) {
	let __self = this;
	__self.mongoCore.findOne(colName, condition, options, (err, item) => {
		if (err) {
			return cb(err, null);
		}
		if (!item) {
			let error = new Error("Registry: item not found.");
			return cb(error, null);
		}
		access.check_can_access(data, item, cb);
	});
};

Registry.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Registry;
