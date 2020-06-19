/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';

const get = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

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
	
	"add": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData || !inputmaskData.settings) {
			return cb(bl.handleError(soajs, 400, null));
		}
		
		let add = (env) => {
			if (!env) {
				return cb(bl.handleError(soajs, 401, null));
			}
			let modelObj = bl.mp.getModel(soajs, options);
			modelObj.add(env, (err) => {
				bl.mp.closeModel(modelObj);
				if (err) {
					return cb(bl.handleError(soajs, 602, err));
				}
				return cb(null, {"added": true});
			});
		};
		
		let env = null;
		if (inputmaskData.settings.type === "local") {
			env = require("./templates/env_local.js");
			//NOTE: mongo client sdk adds _id after first usage
			delete env._id;
			env.code = inputmaskData.code;
			env.description = inputmaskData.description;
			env.port = inputmaskData.settings.port;
			add(env);
		} else if (inputmaskData.settings.type === "kubernetes") {
			env = require("./templates/env_kubernetes.js");
			//NOTE: mongo client sdk adds _id after first usage
			delete env._id;
			env.code = inputmaskData.code;
			env.description = inputmaskData.description;
			env.deployer.container.kubernetes.namespace = inputmaskData.settings.namespace;
			env.deployer.container.kubernetes.id = inputmaskData.settings.id;
			
			sdk.infra.create.namespace(soajs, {
				"name": inputmaskData.settings.namespace,
				"env": inputmaskData.code
			}, (error, data) => {
				if (data) {
					sdk.infra.update.account_env(soajs, {
						"id": inputmaskData.settings.id,
						"env": inputmaskData.code
					}, (error, data) => {
						if (data) {
							add(env);
						} else {
							return cb(bl.handleError(soajs, 404, null));
						}
					});
				} else {
					return cb(bl.handleError(soajs, 403, null));
				}
			});
		}
	},
	
	"delete": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		
		//TODO: cleanup not supported yet: if kubernetes delete all the deployment configuration of the deleted env
		
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.get({"code": inputmaskData.code, "id": inputmaskData.id, "noProjection": true}, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			if (response) {
				let regConf = null;
				let depType = get(["deployer", "type"], response);
				if (depType === "container") {
					let depSeleted = get(["deployer", "selected"], response);
					regConf = get(["deployer"].concat(depSeleted.split(".")), response);
				}
				if (regConf && regConf.id) {
					sdk.infra.update.account_env(soajs, {
						"id": regConf.id,
						"env": inputmaskData.code,
						"delete": true
					}, () => {
					});
				}
			}
			modelObj.delete(inputmaskData, (err, response) => {
				bl.mp.closeModel(modelObj);
				if (err) {
					return cb(bl.handleError(soajs, 602, err));
				}
				let result = {};
				if (response) {
					result.n = response.result.n;
					result.ok = response.result.ok;
					result.deletedCount = response.deletedCount;
				}
				
				return cb(null, result);
			});
		});
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
			return cb(null, response);
		});
	},
	
	"update": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		let continue_update = () => {
			inputmaskData._groups = getGroups(soajs);
			modelObj.update(inputmaskData, (err, response) => {
				bl.mp.closeModel(modelObj);
				if (err) {
					return cb(bl.handleError(soajs, 602, err));
				}
				return cb(null, bl.handleUpdateResponse(response));
			});
		};
		modelObj.get({"code": inputmaskData.code, "noProjection": true}, (err, response) => {
			if (err) {
				bl.mp.closeModel(modelObj);
				return cb(bl.handleError(soajs, 602, err));
			}
			if (response) {
				let regConf = null;
				let depSeleted = null;
				let depType = get(["deployer", "type"], response);
				if (depType === "container") {
					depSeleted = get(["deployer", "selected"], response);
					regConf = get(["deployer"].concat(depSeleted.split(".")), response);
				}
				if (regConf) {
					inputmaskData.depSeleted = "deployer." + depSeleted + ".namespace";
				}
				if (inputmaskData.settings && inputmaskData.settings.namespace && !regConf) {
					return cb(bl.handleError(soajs, 405, null));
				} else {
					if (inputmaskData.settings && inputmaskData.settings.namespace) {
						sdk.infra.create.namespace(soajs, {
							"name": inputmaskData.settings.namespace,
							"env": inputmaskData.code
						}, (error, data) => {
							if (data) {
								continue_update();
							} else {
								bl.mp.closeModel(modelObj);
								return cb(bl.handleError(soajs, 403, null));
							}
						});
					} else {
						continue_update();
					}
				}
			} else {
				bl.mp.closeModel(modelObj);
				return cb(bl.handleError(soajs, 502, null));
			}
		});
	},
	
	"update_acl": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		inputmaskData._groups = getGroups(soajs);
		modelObj.update_acl(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, bl.handleUpdateResponse(response));
		});
	}
};

module.exports = bl;
	