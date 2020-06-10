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
			service.get("/ledger/:type", function (req, res) {
				bl.ledger.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			service.get("/environment", function (req, res) {
				bl.environment.get(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
			
			//DELETE methods
			service.delete("/environment", function (req, res) {
				bl.environment.delete(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
					let response = req.soajs.buildResponse(error, data);
					res.json(response);
					
					let doc = {
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
			
			
			//PUT methods
			service.put("/environment/acl", function (req, res) {
				bl.environment.update_acl(req.soajs, req.soajs.inputmaskData, null, (error, data) => {
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