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


describe("Testing add resource", () => {
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"env": "STG",
				"data": {
					"name": "myMongo",
					"plugged": true,
					"shared": true,
					"sharedEnv": {"DEV": true},
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
					"id": body.data[0]._id,
					"data": {
						"name": "myMongo69",
						"plugged": false,
						"shared": false,
						"config": {"ip": "127.0.0.1"}
					}
				}
			};
			requester('/registry/resource', 'put', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				done();
			});
		});
	});
	
});