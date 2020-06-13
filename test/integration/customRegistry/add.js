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


describe("Testing add custom registry", () => {
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"env": "STG",
				"data": {
					"name": "oauth",
					"plugged": true,
					"shared": true,
					"sharedEnv": {"DEV": true},
					"value": {"ip": "127.0.0.1"}
				}
			}
		};
		requester('/registry/custom', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
});