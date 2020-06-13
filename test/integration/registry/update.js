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
			body: {
				env: "STG",
				domain: "soajs.io",
				apiPrefix: "api",
				sitePrefix: "cloud",
				port: 80,
				protocol: "http",
				description: "SOAJS Console Environment",
		
				services: {
					controller: {
						authorization: true,
						requestTimeout: 30,
						requestTimeoutRenewal: 5
					},
					config: {
						awareness: {
							cacheTTL: 7200000,
							healthCheckInterval: 5000,
							autoRelaodRegistry: 86400000,
							maxLogCount: 5,
							autoRegisterService: true
						},
						logger: {
							src: false,
							level: "error",
							formatter: {
								levelInString: false,
								outputMode: "short"
							}
						},
						cors: {
							enabled: true,
							origin: "*",
							credentials: "true",
							methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
							headers: "key,soajsauth,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,__env",
							maxage: 1728000
						},
						oauth: {
							debug: false,
							getUserFromToken: true,
							accessTokenLifetime: 7200,
							refreshTokenLifetime: 1209600
						},
						ports: {
							controller: 4000,
							maintenanceInc: 1000,
							randomInc: 100
						}
					}
				}
			}
		};
		requester('/registry', 'put', params, (error, body) => {
			assert.ifError(error);
			assert.ok(body);
			assert.ok(body.data);
			done();
		});
	});
	
});