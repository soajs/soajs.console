/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const colName = "settings";
const core = require("soajs");
const Mongo = core.mongo;

let indexing = {};

function Settings(service, options, mongoCore) {
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
			if (registry && registry.coreDB && registry.coreDB.provision) {
				__self.mongoCore = new Mongo(registry.coreDB.provision);
			}
		}
	}
	let index = "default";
	if (options && options.index) {
		index = options.index;
	}
	if (indexing && !indexing[index]) {
		indexing[index] = true;
		
		service.log.debug("cdToken: Indexes for " + index + " Updated!");
	}
}

Settings.prototype.getOne = function (data, cb) {
	let __self = this;
	let condition = {
		type: data.type
	};
	let options = {};
	__self.mongoCore.findOne(colName, condition, options, cb);
};

Settings.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Settings;