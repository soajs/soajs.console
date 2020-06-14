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


describe("Testing add environment", () => {
	
	
	it("Success - add and delete", (done) => {
		let params = {
			body: {
				"code": "del",
				"description": "this is about my added env",
				"settings": {
					"type": "local",
					"port": 10000
				}
			}
		};
		requester('/environment', 'post', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			
			let params = {
				body: {
					"code": "del"
				}
			};
			requester('/environment', 'del', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				assert.deepStrictEqual(body.data, {n: 1, ok: 1, deletedCount: 1});
				
				let params = {
					qs: {
						"code": "del"
					}
				};
				requester('/environment', 'get', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.strictEqual(body.data, null);
					done();
				});
			});
		});
	});
	
});