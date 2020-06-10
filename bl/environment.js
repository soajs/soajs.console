/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';

const sdk = require("../lib/sdk.js");

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
			modelObj.add(env, (err, response) => {
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
			env.code = inputmaskData.code;
			env.description = inputmaskData.description;
			env.port = inputmaskData.settings.port;
			add(env);
		} else if (inputmaskData.settings.type === "kubernetes") {
			env = require("./templates/env_kubernetes.js");
			env.code = inputmaskData.code;
			env.description = inputmaskData.description;
			env.deployer.container.kubernetes.remote.namespace.default = inputmaskData.settings.namespace;
			
			let data = {
				"id": inputmaskData.settings.id
			};
			sdk.infra.get.account_token(soajs, data, (error, infra) => {
				if (!infra || !infra.configuration || !infra.configuration.url || !infra.configuration.port || !infra.configuration.token) {
					return cb(bl.handleError(soajs, 402, null));
				}
				if (infra.configuration.protocol) {
					env.deployer.container.kubernetes.remote.apiProtocol = infra.configuration.protocol;
				}
				env.deployer.container.kubernetes.remote.nodes = infra.configuration.url;
				env.deployer.container.kubernetes.remote.apiPort = infra.configuration.port;
				env.deployer.container.kubernetes.remote.auth.token = infra.configuration.token;
				
				add(env);
			});
		}
	},
	
	"delete": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		//get environment and check type (local | kubernetes)
		// if local delete env
		// if kubernetes
		// delete namespace and then delete env
	},
	
	"get": (soajs, inputmaskData, options, cb) => {
		if (!inputmaskData) {
			return cb(bl.handleError(soajs, 400, null));
		}
		//get environment but filter sensitive data before returning
	}
};

module.exports = bl;
	