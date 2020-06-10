'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const express = require('express');
const sApp = express();
const mApp = express();

function startServer(serverConfig, callback) {
	sApp.post('/kubernetes/namespace', (req, res) => {
		let sReply = {
			"result": true,
			"data": {"created": true}
		};
		res.json(sReply);
	});
	sApp.get('/account/kubernetes/token', (req, res) => {
		let sReply = {
			"result": true,
			"data": {
				"configuration": {
					"url": "kubernetes.docker.internal",
					"port": "6443",
					"token": "TTTTTTTTTTTTTTT"
				}
			}
		};
		res.json(sReply);
	});
	
	mApp.get('/heartbeat', (req, res) => {
		let mReply = {
			'result': true,
			'ts': Date.now(),
			'service': {
				'service': serverConfig.name,
				'type': 'rest',
				'route': "/heartbeat"
			}
		};
		res.json(mReply);
	});
	
	let sAppServer = sApp.listen(serverConfig.s.port, () => console.log(`${serverConfig.name} service mock listening on port ${serverConfig.s.port}!`));
	let mAppServer = mApp.listen(serverConfig.m.port, () => console.log(`${serverConfig.name} service mock listening on port ${serverConfig.m.port}!`));
	
	return callback(
		{
			"sAppServer": sAppServer,
			"mAppServer": mAppServer,
			"name": serverConfig.name
		}
	);
}

function killServer(config) {
	console.log("killing server ....");
	
	config.mAppServer.close(() => {
		console.log("...sAppServer: " + config.name);
	});
	
	config.sAppServer.close(() => {
		console.log("...mAppServer: " + config.name);
	});
}

module.exports = {
	startServer: startServer,
	killServer: killServer
};