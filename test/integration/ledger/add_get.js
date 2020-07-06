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


describe("Testing add, and get ledger", () => {
	
	
	it("Success - add get", (done) => {
		let params = {
			body: {
				"doc": {
					"type": "Registry",
					"section": "Custom",
					"locator": ["oauth"],
					"action": "added",
					"status": "succeeded",
					"header": {
						"userAgent": "safari"
					},
					"input": {
						"qs1": "anything"
					},
					"output": {
						"nothing": "blabla"
					}
				}
			}
		};
		requester('/ledger', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			assert.strictEqual(body.data.type, "Registry");
			
			let params = {
				body: {
					"doc": {
						"type": "Registry",
						"section": "Default",
						"locator": ["Configuration"],
						"action": "updated",
						"status": "succeeded",
						"header": {},
						"input": {
							"key": "anything"
						},
						"output": {
							"nothing": "blabla"
						}
					}
				}
			};
			requester('/ledger', 'post', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				assert.strictEqual(body.data.type, "Registry");
				
				let params = {
					"type": 'Registry'
				};
				requester('/ledger', 'get', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.ok(body.data);
					let validate = (body.data.count >= 2);
					assert.strictEqual(validate, true);
					done();
				});
			});
		});
	});
	
});