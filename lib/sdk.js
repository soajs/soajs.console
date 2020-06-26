/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

const request = require("request");

let sdk = {
	"infra": {
		"delete": {
			"namespace": (soajs, data, cb) => {
				if (!data.name || !data.env) {
					return cb(null, null);
				}
				soajs.awareness.connect("infra", "1", (response) => {
					if (response && response.host) {
						let options = {
							uri: 'http://' + response.host + "/kubernetes/namespace",
							headers: response.headers,
							body: {"name": data.env, "configuration": {"env": data.env}},
							json: true
						};
						request.delete(options, function (error, response, body) {
							if (error && error.message) {
								soajs.log.error(error.message);
							} else if (body && (!body.result || body.errors)) {
								soajs.log.error(body.errors);
							}
							if (body && body.result && body.data && body.data.deleted) {
								return cb(null, true);
							} else {
								return cb(null, null);
							}
						});
					} else {
						return cb(null, null);
					}
				});
			}
		},
		"create": {
			"namespace": (soajs, data, cb) => {
				if (!data.name) {
					return cb(null, null);
				}
				soajs.awareness.connect("infra", "1", (response) => {
					if (response && response.host) {
						let options = {
							uri: 'http://' + response.host + "/kubernetes/namespace",
							headers: response.headers,
							body: {"name": data.name},
							json: true
						};
						if (data.id) {
							options.body.configuration = {"id": data.id};
						} else if (data.env) {
							options.body.configuration = {"env": data.env};
						}
						request.post(options, function (error, response, body) {
							if (error && error.message) {
								soajs.log.error(error.message);
							} else if (body && (!body.result || body.errors)) {
								if (body.errors.codes[0] === 702 && body.errors.details[0].message.includes("already exists")) {
									return cb(null, true);
								}
								soajs.log.error(body.errors);
								if (body.errors.details[0].message) {
									error = new Error(body.errors.details[0].message);
								}
							}
							if (body && body.result && body.data && body.data.created) {
								return cb(error, true);
							} else {
								return cb(error, null);
							}
						});
					} else {
						return cb(null, null);
					}
				});
			}
		},
		"update": {
			"account_env": (soajs, data, cb) => {
				if (!data.id || !data.env) {
					return cb(null, null);
				}
				soajs.awareness.connect("infra", "1", (response) => {
					if (response && response.host) {
						let options = {
							uri: 'http://' + response.host + "/account/kubernetes/environment",
							headers: response.headers,
							body: {
								"id": data.id,
								"environment": {"env": data.env, "namespace": data.namespace || null},
								"delete": !!data.delete
							},
							json: true
						};
						request.put(options, function (error, response, body) {
							if (error && error.message) {
								soajs.log.error(error.message);
							} else if (body && (!body.result || body.errors)) {
								soajs.log.error(body.errors);
							}
							if (body && body.result && body.data) {
								return cb(null, body.data);
							} else {
								return cb(null, null);
							}
						});
					} else {
						return cb(null, null);
					}
				});
			}
		},
		"get": {
			"account_token": (soajs, data, cb) => {
				if (!data.id) {
					return cb(null, null);
				}
				soajs.awareness.connect("infra", "1", (response) => {
					if (response && response.host) {
						let options = {
							uri: 'http://' + response.host + "/account/kubernetes/token",
							headers: response.headers,
							qs: {"id": data.id},
							json: true
						};
						request.get(options, function (error, response, body) {
							if (error && error.message) {
								soajs.log.error(error.message);
							} else if (body && (!body.result || body.errors)) {
								soajs.log.error(body.errors);
							}
							if (body && body.result && body.data) {
								return cb(null, body.data);
							} else {
								return cb(null, null);
							}
						});
					} else {
						return cb(null, null);
					}
				});
			}
		}
	}
};

module.exports = sdk;