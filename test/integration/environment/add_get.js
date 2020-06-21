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
	
	
	it("Success - add and get", (done) => {
		let params = {
			body: {
				"code": "anto",
				"description": "this is about my added env",
				"settings": {
					"type": "manual",
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
					"code": "hage",
					"description": "this is about my added env",
					"settings": {
						"type": "kubernetes",
						"namespace": "hage",
						"id": "1111"
					}
				}
			};
			requester('/environment', 'post', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				
				
				let params = {};
				requester('/environment', 'get', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.ok(body.data);
					let validate = (body.data.length >= 2);
					assert.strictEqual(validate, true);
					done();
				});
			});
		});
	});
	
});