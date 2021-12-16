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


describe("Testing add ledger", () => {
	
	
	it("Success - add", (done) => {
		let params = {
			body: {
				"doc": {
					"type": "Registry",
					"section": "Custom",
					"locator": ["urac"],
					"action": "added",
					"status": "succeeded",
					"header": {
						"userAgent": "firefox"
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
			assert.deepEqual(body.data.type, "Registry");
			done();
		});
	});
	
});
