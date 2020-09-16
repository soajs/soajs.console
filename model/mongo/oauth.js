/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "oauth_urac";
const core = require("soajs");
const Mongo = core.mongo;

let indexing = {};

function Oauth(service, options, mongoCore) {
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
			
			service.log.debug("Oauth: Indexes for " + index + " Updated!");
		}
	}
}

Oauth.prototype.list = function (data, cb) {
	let __self = this;
	if (!data || !data.id) {
		let error = new Error("Oauth: id is required.");
		return cb(error, null);
	}
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		let condition = {'_id': id};
		__self.mongoCore.find(colName, condition, (err, records) => {
			return cb(err, records);
		});
	});
};

Oauth.prototype.count = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.userId) {
		let error = new Error("Oauth: id and userId are required.");
		return cb(error, null);
	}
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		let condition = {'tId': id, "userId": data.userId};
		__self.mongoCore.count(colName, condition, (err, count) => {
			return cb(err, count);
		});
	});
};

Oauth.prototype.add = function (data, cb) {
	let __self = this;
	if (!data) {
		let error = new Error("Oauth: data is required.");
		return cb(error, null);
	}
	__self.mongoCore.insert(colName, data, (err, record) => {
		if (record && Array.isArray(record)) {
			record = record[0];
		}
		return cb(err, record);
	});
};

Oauth.prototype.checkUser = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.userId || !data.uId) {
		let error = new Error("Oauth: id, userId, and uId are required.");
		return cb(error, null);
	}
	
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		__self.validateId(data.uId, (err, uId) => {
			if (err) {
				return cb(err, null);
			}
			let condition = {
				'tId': id,
				"userId": data.userId,
				"_id": {$ne: uId}
			};
			__self.mongoCore.count(colName, condition, (err, count) => {
				return cb(err, count);
			});
		});
	});
};

Oauth.prototype.get = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.uId) {
		let error = new Error("Oauth: id and uId are required.");
		return cb(error, null);
	}
	
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		__self.validateId(data.uId, (err, uId) => {
			if (err) {
				return cb(err, null);
			}
			let condition = {
				'tId': id,
				"_id": uId
			};
			__self.mongoCore.count(colName, condition, (err, record) => {
				return cb(err, record);
			});
		});
	});
};

Oauth.prototype.update = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.uId || !data.userId || !data.password) {
		let error = new Error("Oauth: id, uId, userId, and password are required.");
		return cb(error, null);
	}
	
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		__self.validateId(data.uId, (err, uId) => {
			if (err) {
				return cb(err, null);
			}
			let condition = {
				'tId': id,
				"_id": uId
			};
			let options = {};
			let fields = {
				'$set': {
					userId: data.userId,
					password: data.password
				}
			};
			__self.mongoCore.updateOne(colName, condition, fields, options, (err, record) => {
				return cb(err, record);
			});
		});
	});
};


Oauth.prototype.delete = function (data, cb) {
	let __self = this;
	if (!data || !data.id || !data.uId) {
		let error = new Error("Oauth: id and uId are required.");
		return cb(error, null);
	}
	__self.validateId(data.id, (err, id) => {
		if (err) {
			return cb(err, null);
		}
		__self.validateId(data.uId, (err, uId) => {
			if (err) {
				return cb(err, null);
			}
			let condition = {"tId": id, "_id": uId};
			__self.mongoCore.delete(colName, condition, (err) => {
				return cb(err);
			});
		});
	});
};

Oauth.prototype.validateId = function (id, cb) {
	let __self = this;
	
	if (!id) {
		let error = new Error("id is required.");
		return cb(error, null);
	}
	
	try {
		id = __self.mongoCore.ObjectId(id);
		return cb(null, id);
	} catch (e) {
		return cb(e, null);
	}
};


Oauth.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Oauth;
