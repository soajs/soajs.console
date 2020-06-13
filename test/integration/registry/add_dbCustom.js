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


describe("Testing add DB", () => {
	
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"env": "STG",
				"prefix": "math",
				"name": "urac",
				"cluster": "dash_cluster",
				"tenantSpecific": true
			}
		};
		requester('/registry/db/custom', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
});