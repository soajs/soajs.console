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


describe("Testing update registry", () => {
	
	
	it("Success - update", (done) => {
		let params = {
			qs: {"env": "STG"}
		};
		requester('/registry/throttling', 'get', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.strictEqual(body.data.publicAPIStrategy, "tony");
			done();
		});
	});
	
});