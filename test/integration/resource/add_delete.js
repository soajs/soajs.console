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


describe("Testing add delete resource", () => {
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"env": "PROD",
				"data": {
					"name": "mysql",
					"plugged": true,
					"shared": true,
					"sharedEnvs": {"DEV": true},
					"config": {"ip": "127.0.0.1"},
					"type": "cluster",
					"category": "mongo"
				}
			}
		};
		requester('/registry/resource', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			
			let params = {
				body: {
					"id": body.data._id,
				}
			};
			requester('/registry/resource', 'delete', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				assert.deepStrictEqual(body.data, {n: 1, ok: true, deletedCount: 1});
				done();
			});
		});
	});
	
});
