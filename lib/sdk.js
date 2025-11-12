/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

const axios = require("axios");
const commonResponse = require("./commonResponse.js");

let sdk = {
	"infra": {
		"create": {
			"namespace": (soajs, data, cb) => {
				if (!data.name) {
					return cb(null, null);
				}
				soajs.awareness.connect("infra", "1", (response) => {
					if (response && response.host) {
						let body = {"name": data.name};
						if (data.id) {
							body.configuration = {"id": data.id};
						} else if (data.env) {
							body.configuration = {"env": data.env};
						}
						axios.post('http://' + response.host + "/kubernetes/namespace", body, { headers: response.headers })
							.then((result) => {
								// Handle special case for namespace already exists
								if (result.data && result.data.errors && result.data.errors.codes &&
									result.data.errors.codes[0] === 702 &&
									result.data.errors.details && result.data.errors.details[0] &&
									result.data.errors.details[0].message &&
									result.data.errors.details[0].message.includes("already exists")) {
									return cb(null, true);
								}
								return commonResponse(soajs, result.data, null, (error, data) => {
									if (data && data.created) {
										return cb(error, true);
									} else {
										return cb(error, null);
									}
								});
							})
							.catch((error) => {
								// Handle special case for namespace already exists in error response
								if (error.response && error.response.data && error.response.data.errors &&
									error.response.data.errors.codes && error.response.data.errors.codes[0] === 702 &&
									error.response.data.errors.details && error.response.data.errors.details[0] &&
									error.response.data.errors.details[0].message &&
									error.response.data.errors.details[0].message.includes("already exists")) {
									return cb(null, true);
								}
								return commonResponse(soajs, null, error, (error, data) => {
									if (data && data.created) {
										return cb(error, true);
									} else {
										return cb(error, null);
									}
								});
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
						let body = {
							"id": data.id,
							"environment": {"env": data.env, "namespace": data.namespace || null},
							"delete": !!data.delete
						};
						axios.put('http://' + response.host + "/account/kubernetes/environment", body, { headers: response.headers })
							.then((result) => {
								return commonResponse(soajs, result.data, null, (error, data) => {
									return cb(null, data);
								});
							})
							.catch((error) => {
								return commonResponse(soajs, null, error, () => {
									return cb(null, null);
								});
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
						axios.get('http://' + response.host + "/account/kubernetes/token", {
							headers: response.headers,
							params: {"id": data.id}
						})
							.then((result) => {
								return commonResponse(soajs, result.data, null, (error, data) => {
									return cb(null, data);
								});
							})
							.catch((error) => {
								return commonResponse(soajs, null, error, () => {
									return cb(null, null);
								});
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