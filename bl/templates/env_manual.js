'use strict';

const {v4: uuidv4} = require('uuid');

let doc = {
	"code": "%code%",
	"description": "%description%",
	"domain": "localhost",
	"port": "%port%",
	"protocol": "http",
	"deployer": {
		"type": "manual",
		"selected": "manual",
		"manual": {
			"nodes": "127.0.0.1",
		}
	},
	"dbs": {
		"config": {
			"prefix": ""
		},
		"databases": {}
	},
	"services": {
		"controller": {
			"authorization": false,
			"requestTimeout": 30,
			"requestTimeoutRenewal": 0
		},
		"config": {
			"awareness": {
				"cacheTTL": 1000 * 60 * 60, // 1 hr
				"healthCheckInterval": 1000 * 5, // 5 seconds
				"autoRelaodRegistry": 1000 * 60 * 60 * 24, // 24 hr
				"maxLogCount": 5,
				"autoRegisterService": true
			},
			"key": {
				"algorithm": 'aes256',
				"password": uuidv4()
			},
			"logger": {
				"src": false,
				"level": "error",
				"formatter": {
					"levelInString": false,
					"outputMode": 'short'
				}
			},
			"cors": {
				"enabled": true,
				"origin": '*',
				"credentials": 'true',
				"methods": 'GET,HEAD,PUT,PATCH,POST,DELETE',
				"headers": 'key,soajsauth,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,__env',
				"maxage": 1728000
			},
			"oauth": {
				"grants": ['password', 'refresh_token'],
				"debug": false,
				"getUserFromToken": true,
				"accessTokenLifetime": 7200,
				"refreshTokenLifetime": 1209600
			},
			"ports": {
				"controller": "%port%",
				"maintenanceInc": 1000,
				"randomInc": 100
			},
			"cookie": {
				"secret": uuidv4()
			},
			"session": {
				"name": "soajsID",
				"secret": uuidv4(),
				"cookie": {
					"path": '/',
					"httpOnly": true,
					"secure": false,
					"maxAge": null
				},
				"resave": false,
				"saveUninitialized": false,
				"rolling": false,
				"unset": "keep"
			}
		}
	}
};

module.exports = doc;
