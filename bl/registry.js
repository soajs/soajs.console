/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';

function getGroups(soajs) {
	let _groups = null;
	if (soajs && soajs.urac && soajs.urac.groups) {
		if (Array.isArray(soajs.urac.groups) && soajs.urac.groups.length > 0) {
			_groups = soajs.urac.groups;
		}
	}
	return _groups;
}

let bl = {
	"modelObj": null,
	"model": null,
	"soajs_service": null,
	"localConfig": null,
	
	"handleError": (soajs, errCode, err) => {
		if (err) {
			soajs.log.error(err.message);
		}
		return ({
			"code": errCode,
			"msg": bl.localConfig.errors[errCode] + ((err && errCode === 602) ? err.message : "")
		});
	},
	"handleUpdateResponse": (response) => {
		if (response) {
			return true;
		} else {
			return false;
		}
	},
	"mp": {
		"getModel": (soajs) => {
			let modelObj = bl.modelObj;
			if (soajs && soajs.tenant && soajs.tenant.type === "client" && soajs.tenant.dbConfig) {
				let options = {
					"dbConfig": soajs.tenant.dbConfig,
					"index": soajs.tenant.id
				};
				modelObj = new bl.model(bl.soajs_service, options, null);
			}
			return modelObj;
		},
		"closeModel": (soajs, modelObj) => {
			if (soajs && soajs.tenant && soajs.tenant.type === "client" && soajs.tenant.dbConfig) {
				modelObj.closeConnection();
			}
		}
	},
	
	"get": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.get(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			if (response) {
				delete response.deployer;
				delete response.throttling;
				if (response.services) {
					delete response.services.key;
					delete response.services.cookie;
					delete response.services.session;
				}
			}
			return cb(null, response);
		});
	},
	"getThrottling": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.get(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			let throttling = null;
			if (response) {
				throttling = response.throttling;
			}
			return cb(null, throttling);
		});
	},
	"deleteDB": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	},
	"addDB": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	},
	"updateDBPrefix": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	},
	"updateDBSession": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	},
	"update": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	},
	"updateThrottling": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
	}
	
};

module.exports = bl;
	