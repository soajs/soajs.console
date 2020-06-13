/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const imported = require("../data/import.js");
let helper = require("../helper.js");


let infra_ms = require('./mock/infra-service-mock.js');
let infra_servers = null;

describe("starting integration tests", () => {
	
	let controller, service;
	
	before((done) => {
		let rootPath = process.cwd();
		//process.env.SOAJS_IMPORTER_DROPDB = true;
		imported.runPath(rootPath + "/test/data/soajs_profile.js", rootPath + "/test/data/integration/", true, null, (err, msg) => {
			if (err) {
				console.log(err);
			}
			if (msg) {
				console.log(msg);
			}
			console.log("Starting Controller ...");
			controller = require("soajs.controller/_index.js");
			controller.runService(() => {
				console.log("Starting Console ...");
				service = helper.requireModule('./_index.js');
				service.runService(() => {
					infra_ms.startServer({s: {port: 4008}, m: {port: 5008}, name: "infra"}, function (servers) {
						infra_servers = servers;
						setTimeout(function () {
							done();
						}, 5000);
					});
				});
			});
		});
	});
	
	after((done) => {
		//infra_ms.killServer(infra_servers);
		done();
	});
	
	it("loading tests", (done) => {
		
		require("./ledger/add.js");
		require("./ledger/add_get.js");
		
		require("./environment/add.js");
		require("./environment/add_get.js");
		require("./environment/add_delete.js");
		
		require("./registry/update.js");
		require("./registry/update_prefix.js");
		require("./registry/update_sessionDB.js");
		require("./registry/update_throttling.js");
		
		require("./registry/add_dbCustom.js");
		require("./registry/delete_dbCustom.js");
		
		require("./registry/get.js");
		require("./registry/get_throttling.js");
		done();
	});
	
	it("loading use cases", (done) => {
		done();
	});
});