/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

const assert = require('assert');
const requester = require('../requester.js');


describe("Testing update db session", () => {
	
	
	it("Success - update", (done) => {
		let params = {
			body: {
				env: "STG",
				prefix: "sasa",
				"name" : "core_session",
				"cluster" : "dash_cluster",
				"store" : {"tony":"hage"},
				"collection" : "sessions",
				"stringify" : true,
				"expireAfter" : 1209600000
			}
		};
		requester('/registry/db/session', 'put', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
});