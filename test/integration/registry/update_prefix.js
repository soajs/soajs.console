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


describe("Testing update prefix", () => {
	
	
	it("Success - update", (done) => {
		let params = {
			body: {
				env: "STG",
				prefix: "math"
			}
		};
		requester('/registry/db/prefix', 'put', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
});