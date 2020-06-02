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
				"locator": ["Custom registry", "oauth"],
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
		};
		requester('/ledger/Registry', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			assert.deepEqual(body.data.type, "Registry");
			
			let params = {
				body: {
					"locator": ["Registry"],
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
			};
			requester('/ledger/Registry', 'post', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				assert.deepEqual(body.data.type, "Registry");
				
				let params = {};
				requester('/ledger/Registry', 'get', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.ok(body.data);
					let validate = (body.data.length >= 2);
					assert.deepEqual(validate, true);
					done();
				});
			});
		});
	});
	
});