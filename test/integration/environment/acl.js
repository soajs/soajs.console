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


describe("Testing ACL environment", () => {
	
	
	it("Success - ACL", (done) => {
		let params = {
			body: {
				"code": "ACL",
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
					"code": "ACL",
					"type": "blacklist",
					"groups": ["owner"]
				}
			};
			requester('/environment/acl', 'put', params, (error, body) => {
				assert.ifError(error);
				assert.ok(body);
				assert.ok(body.data);
				
				let params = {
					qs: {
						"code": "ACL"
					}
				};
				requester('/environment', 'get', params, (error, body) => {
					assert.ifError(error);
					assert.ok(body);
					assert.strictEqual(body.data, null);
					
					let params = {
						body: {
							"code": "ACL",
							"type": "blacklist",
							"groups": ["owner"]
						}
					};
					requester('/environment/acl', 'put', params, (error, body) => {
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
});