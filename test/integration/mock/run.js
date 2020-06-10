'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

let infra_ms = require('./infra-service-mock.js');

infra_ms.startServer({s: {port: 4008}, m: {port: 5008}, name: "infra"}, function (servers) {
	console.log(servers);
});