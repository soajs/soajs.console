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


describe("Testing add oauth user", () => {
	
	it("Success - add", (done) => {
		let params = {
			"qs": {
				"id": "5f632ff4704589bcaad3fdf8",
			},
			body: {
				"userId": "ragheb",
				"password": "123"
			}
		};
		requester('/tenant/oauth/user', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
	
});