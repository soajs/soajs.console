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


describe("Testing ACL resource", () => {
	
	it("Success - ACL", (done) => {
		let params = {
			body: {
				"env": "STG",
				"data": {
					"name": "infra_acl",
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
					"type": "blacklist",
					"groups": ["owner"]
				}
			};
			requester('/registry/resource/acl', 'put', params, (error, body2) => {
				assert.ifError(error);
				assert.ok(body2);
				assert.ok(body2.data);
				let params = {
					body: {
						"id": body.data._id,
						"data": {
							"name": "urac",
							"plugged": false,
							"shared": false,
							"config": {"ip": "127.0.0.1"}
						}
					}
				};
				requester('/registry/resource', 'put', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.deepStrictEqual(body.errors,
						{
							codes: [602],
							details:
								[{
									code: 602,
									message: 'Model error: Access restricted to this record.'
								}]
						});
					done();
				});
			});
		});
	});
	
});
