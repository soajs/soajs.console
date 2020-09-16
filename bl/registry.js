/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';

const sdk = require("../lib/sdk.js");

function getGroups(soajs) {
	let _groups = null;
	if (soajs && soajs.urac && soajs.urac.groups) {
		if (Array.isArray(soajs.urac.groups) && soajs.urac.groups.length > 0) {
			_groups = soajs.urac.groups;
		}
	}
	return _groups;
}

const get = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

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
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.get(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			if (response) {
				//delete response.deployer;
				if (response.services && response.services.config) {
					delete response.services.config.throttling;
					delete response.services.config.key;
					delete response.services.config.cookie;
					delete response.services.config.session;
				}
			}
			return cb(null, response);
		});
	},
	
	"getDeployer": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		
		// get the latest namespace from registry
		modelObj.get(inputmaskData, (err, response) => {
			if (err) {
				soajs.log.error(err.message);
			}
			if (!response || !response.deployer) {
				return cb(bl.handleError(soajs, 501, null));
			}
			let depType = get(["deployer", "type"], response);
			let regConf = null;
			if (depType === "container") {
				let depSeleted = get(["deployer", "selected"], response);
				regConf = get(["deployer"].concat(depSeleted.split(".")), response);
			}
			if (regConf) {
				let id = regConf.id;
				// get the latest url and port from infra
				sdk.infra.get.account_token(soajs, {"id": id}, (error, data) => {
					if (data) {
						regConf.configuration = data.configuration;
						if (regConf.configuration.token) {
							delete regConf.configuration.token;
						}
					}
					
					return cb(null, response.deployer);
				});
			} else {
				return cb(null, response.deployer);
			}
		});
	},
	
	"getThrottling": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.get(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			let throttling = null;
			if (response && response.services && response.services.config) {
				throttling = response.services.config.throttling || null;
			}
			return cb(null, throttling);
		});
	},
	"deleteDB": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.deleteDB(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"deleteDBSession": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.deleteDBSession(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"addDB": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		modelObj.addDB(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"updateDBPrefix": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.updateDBPrefix(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"updateDBSession": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.updateDBSession(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"update": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.update(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	},
	"updateThrottling": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		if (inputmaskData.env) {
			inputmaskData.env = inputmaskData.env.toUpperCase();
		}
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.updateThrottling(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	}
	
};

module.exports = bl;
	