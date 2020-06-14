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


describe("Testing add delete custom registry", () => {
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"env": "PROD",
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
			
			let params = {
				body: {
					"id": body.data[0]._id,
				}
			};
			requester('/registry/custom', 'delete', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				assert.deepStrictEqual(body.data, {n: 1, ok: 1, deletedCount: 1});
				done();
			});
		});
	});
	
});