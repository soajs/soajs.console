/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "ledger";
const core = require("soajs");
const Mongo = core.mongo;

let indexing = {};

function Ledger(service, options, mongoCore) {
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
			
			__self.mongoCore.createIndex(colName, {'type': 1, 'section': 1}, {}, (err, index) => {
				service.log.debug("Index: " + index + " created with error: " + err);
			});
			
			service.log.debug("ledger: Indexes for " + index + " Updated!");
		}
	}
}

Ledger.prototype.add = function (data, cb) {
	let __self = this;
	if (!data || !data.doc || !data.doc.type || !data.doc.locator || !data.doc.section || !data.doc.action || !data.doc.status || !data.who) {
		let error = new Error("Ledger: type, locator, action, status, and who are required.");
		return cb(error, null);
	}
	let options = {};
	let doc = {
		type: data.doc.type,
		section: data.doc.section,
		locator: data.doc.locator,
		action: data.doc.action,
		status: data.doc.status,
		who: data.who,
		time: new Date().getTime()
	};
	if (data.doc.env) {
		doc.env = data.doc.env.toLowerCase();
	}
	if (data.doc.header) {
		doc.header = JSON.stringify(data.doc.header);
	}
	if (data.doc.input) {
		doc.input = JSON.stringify(data.doc.input);
	}
	if (data.doc.output) {
		doc.output = JSON.stringify(data.doc.output);
	}
	let versioning = false;
	__self.mongoCore.insertOne(colName, doc, options, versioning, cb);
};

Ledger.prototype.get = function (data, cb) {
	let __self = this;
	let condition = {};
	if (data && data.type) {
		condition.type = data.type;
	}
	if (data && data.section) {
		condition.section = data.section;
	}
	if (data && data.env) {
		condition.env = data.env.toLowerCase();
	}
	let options = {
		"skip": 0,
		"limit": 100
	};
	options.sort = {"_id": -1};
	if (data && data.limit) {
		options.limit = data.limit;
	}
	if (data && data.start) {
		options.skip = data.start;
	}
	__self.mongoCore.find(colName, condition, options, (error, response) => {
		if (error) {
			return cb(error);
		} else {
			let current_count = options.skip;
			if (response && response.length) {
				current_count = current_count + response.length;
			}
			if (current_count < options.limit) {
				return cb(null, {
					"limit": options.limit,
					"start": options.skip,
					"count": response.length,
					"items": response
				});
			} else {
				__self.count(data, condition, (error, count) => {
					if (error) {
						return cb(error);
					} else {
						return cb(null, {
							"limit": options.limit,
							"start": options.skip,
							"count": count,
							"items": response
						});
					}
				});
			}
		}
	});
};

Ledger.prototype.count = function (data, condition, cb) {
	let __self = this;
	let options = {};
	__self.mongoCore.countDocuments(colName, condition, options, cb);
};

Ledger.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Ledger;