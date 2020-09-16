'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const soajs = require('soajs');

let config = require('./config.js');
config.packagejson = require("./package.json");

const bl = require("./bl/index.js");

const service = new soajs.server.service(config);

function run(serviceStartCb) {
	service.init(() => {
		bl.init(service, config, (error) => {
			if (error) {
				throw new Error('Failed starting service');
			}
			
			//GET methods
			service.get("/ledger", function (req, res) {
				bl.ledger.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/environment", function (req, res) {
				bl.environment.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/environment/settings", function (req, res) {
				bl.environment.getSettings(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/release", function (req, res) {
				bl.settings.get_release(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			service.get("/ui/setting", function (req, res) {
				bl.settings.get_ui_setting(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			service.get("/registry", function (req, res) {
				bl.registry.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			service.get("/registry/key", function (req, res) {
				bl.registry.getKey(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/registry/throttling", function (req, res) {
				bl.registry.getThrottling(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/registry/custom", function (req, res) {
				bl.customRegistry.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/registry/resource", function (req, res) {
				bl.resource.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/registry/deployer", function (req, res) {
				bl.registry.getDeployer(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/tenant/oauth/users", function (req, res) {
				bl.oauth.list(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			//DELETE methods
			service.delete("/environment", function (req, res) {
				bl.environment.delete(req.soajs, req.soajs.inputmaskData, null, (error, data, envCode) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": envCode,
						"type": "Notification",
						"section": "Environment",
						"locator": ["Code", req.soajs.inputmaskData.code],
						"action": "deleted",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.delete("/environment/acl", function (req, res) {
				bl.environment.delete_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.delete("/registry/db/session", function (req, res) {
				bl.registry.deleteDBSession(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.delete("/registry/db/custom", function (req, res) {
				bl.registry.deleteDB(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "DB",
						"locator": [req.soajs.inputmaskData.name],
						"action": "deleted",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.delete("/registry/custom", function (req, res) {
				bl.customRegistry.delete(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Custom",
						"locator": [req.soajs.inputmaskData.id],
						"action": "deleted",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.delete("/registry/custom/acl", function (req, res) {
				bl.customRegistry.delete_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.delete("/registry/resource", function (req, res) {
				bl.resource.delete(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Resource",
						"locator": [req.soajs.inputmaskData.id],
						"action": "deleted",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.delete("/registry/resource/acl", function (req, res) {
				bl.resource.delete_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.delete("/tenant/oauth/user", function (req, res) {
				bl.oauth.delete(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			//PUT methods
			service.put("/environment/acl", function (req, res) {
				bl.environment.update_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/environment", function (req, res) {
				bl.environment.update(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			service.put("/registry/db/prefix", function (req, res) {
				bl.registry.updateDBPrefix(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/registry/db/session", function (req, res) {
				bl.registry.updateDBSession(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/registry", function (req, res) {
				bl.registry.update(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Default",
						"locator": [],
						"action": "updated",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.put("/registry/throttling", function (req, res) {
				bl.registry.updateThrottling(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/registry/custom", function (req, res) {
				bl.customRegistry.update(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Custom",
						"locator": ["Name", req.soajs.inputmaskData.data.name],
						"action": "updated",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.put("/registry/custom/acl", function (req, res) {
				bl.customRegistry.update_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/registry/resource", function (req, res) {
				bl.resource.update(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Resource",
						"locator": ["Name", req.soajs.inputmaskData.data.name],
						"action": "updated",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.put("/registry/resource/acl", function (req, res) {
				bl.resource.update_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.put("/tenant/oauth/user", function (req, res) {
				bl.oauth.edit(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			//POST methods
			service.post("/ledger", function (req, res) {
				bl.ledger.add(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.post("/environment", function (req, res) {
				bl.environment.add(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"type": "Notification",
						"section": "Environment",
						"locator": ["Code", req.soajs.inputmaskData.code],
						"action": "added",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			
			service.post("/registry/db/custom", function (req, res) {
				bl.registry.addDB(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.post("/registry/custom", function (req, res) {
				bl.customRegistry.add(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Custom",
						"locator": ["Name", req.soajs.inputmaskData.data.name],
						"action": "added",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.post("/registry/resource", function (req, res) {
				bl.resource.add(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
						"env": req.soajs.inputmaskData.env,
						"type": "Registry",
						"section": "Resource",
						"locator": ["Name", req.soajs.inputmaskData.data.name],
						"action": "added",
						"status": (error ? "failed" : "succeeded"),
						"input": req.soajs.inputmaskData,
						"output": data
					};
					bl.ledger.add(req.soajs, {"doc": doc}, null, (error) => {
						if (error && error.message) {
							req.soajs.log.error(error.message);
						} else if (error) {
							req.soajs.log.error(error);
						}
					});
				});
			});
			service.post("/tenant/oauth/user", function (req, res) {
				bl.oauth.add(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.start(serviceStartCb);
		});
	});
}

function stop(serviceStopCb) {
	service.stop(serviceStopCb);
}

module.exports = {
	"runService": (serviceStartCb) => {
		if (serviceStartCb && typeof serviceStartCb === "function") {
			run(serviceStartCb);
		} else {
			run(null);
		}
	},
	"stopService": (serviceStopCb) => {
		if (serviceStopCb && typeof serviceStopCb === "function") {
			stop(serviceStopCb);
		} else {
			stop(null);
		}
	}
};