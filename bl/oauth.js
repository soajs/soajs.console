/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';
const soajs = require("soajs");
const Hasher = soajs.hasher;

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
		return !!response;
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
	
	"list": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		modelObj.list(inputmaskData, (err, response) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, response);
		});
	},
	
	"add": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		modelObj.count(inputmaskData, (err, count) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			if (count > 0) {
				return cb(bl.handleError(soajs, 420, err));
			}
			let encryptionConfig = {
				"hashIterations": bl.localConfig.hasher.hashIterations
			};
			if (soajs.servicesConfig && soajs.servicesConfig.hashIterations) {
				encryptionConfig.hashIterations = soajs.servicesConfig.hashIterations;
			} else {
				let hashIterations = get(["registry", "custom", "urac", "value", "hashIterations"], soajs);
				if (hashIterations) {
					encryptionConfig.hashIterations = hashIterations;
				}
			}
			Hasher.init(encryptionConfig);
			let newPassword = Hasher.hash(inputmaskData.password);
			modelObj.validateId(inputmaskData.id, (err, id) =>{
				if (err) {
					return cb(bl.handleError(soajs, 602, err));
				}
				let oauthUserRecord = {
					"userId": inputmaskData.userId,
					"password": newPassword,
					"tId": id,
					"keys": null
				};
				modelObj.add(oauthUserRecord, (err) => {
					bl.mp.closeModel(modelObj);
					if (err) {
						return cb(bl.handleError(soajs, 602, err));
					}
					return cb(null, "tenant oauth user added");
				});
			});
		});
	},
	"edit": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		
		modelObj.checkUser(inputmaskData, (err, count) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			if (count > 0) {
				return cb(bl.handleError(soajs, 420, err));
			}
			modelObj.get(inputmaskData, (err, record) => {
				bl.mp.closeModel(modelObj);
				if (err) {
					return cb(bl.handleError(soajs, 602, err));
				}
				if (!record) {
					return cb(bl.handleError(soajs, 421, err));
				}
				
				let opts = {
					"tId": inputmaskData.id,
					"uId": inputmaskData.uId,
					
				};
				opts.userId = inputmaskData.userId;
				let encryptionConfig = {
					"hashIterations": bl.localConfig.hasher.hashIterations
				};
				if (soajs.servicesConfig && soajs.servicesConfig.hashIterations) {
					encryptionConfig.hashIterations = soajs.servicesConfig.hashIterations;
				} else {
					let hashIterations = get(["registry", "custom", "urac", "value", "hashIterations"], soajs);
					if (hashIterations) {
						encryptionConfig.hashIterations = hashIterations;
					}
				}
				Hasher.init(encryptionConfig);
				//Hasher.init(bl.localConfig.hasher);
				opts.password = Hasher.hash(inputmaskData.password);
				modelObj.update(opts, (err) => {
					bl.mp.closeModel(modelObj);
					if (err) {
						return cb(bl.handleError(soajs, 602, err));
					}
					return cb(null, "tenant oauth user updated");
				});
			});
		});
	},
	"delete": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		let modelObj = bl.mp.getModel(soajs, options);
		modelObj.delete(inputmaskData, (err) => {
			bl.mp.closeModel(modelObj);
			if (err) {
				return cb(bl.handleError(soajs, 602, err));
			}
			return cb(null, "tenant oauth user removed");
		});
	},
	
};

module.exports = bl;
	