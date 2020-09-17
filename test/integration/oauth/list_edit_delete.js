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


describe("Testing get oauth users", () => {
	let _id;
	it("Success - get all", (done) => {
		let params = {
			"qs": {
				"id": "5f632ff4704589bcaad3fdf8",
			},
		};
		requester('/tenant/oauth/users', 'get', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			_id = body.data[0]._id;
			done();
		});
	});
	
	it("Success - edit", (done) => {
		let params = {
			"qs": {
				"id": "5f632ff4704589bcaad3fdf8",
				"uId": _id
			},
			body: {
				"userId": "raghebs",
				"password": "1234"
			}
		};
		requester('/tenant/oauth/user', 'put', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
	it("Success - delete", (done) => {
		let params = {
			"qs": {
				"id": "5f632ff4704589bcaad3fdf8",
				"uId": _id
			}
		};
		requester('/tenant/oauth/user', 'delete', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
});