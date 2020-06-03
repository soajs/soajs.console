/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';


const ledger_doc = require("./schemas/ledger_doc.js");

module.exports = {
	"type": 'service',
	'subType': 'soajs',
	"description": "This service takes care of updates and upgrades as well as everything related to registry",
	prerequisites: {
		cpu: '',
		memory: ''
	},
	"serviceVersion": "1",
	"serviceName": "console",
	"serviceGroup": "Console",
	"servicePort": 4009,
	"requestTimeout": 30,
	"requestTimeoutRenewal": 5,
	"oauth": true,
	"extKeyRequired": true,
	"urac": true,
	
	"maintenance": {
		"readiness": "/heartbeat",
		"port": {"type": "maintenance"},
		"commands": [
			{"label": "Reload Registry", "path": "/reloadRegistry", "icon": "fas fa-undo"},
			{"label": "Resource Info", "path": "/resourceInfo", "icon": "fas fa-info"}
		]
	},
	
	//-------------------------------------
	"errors": {
		400: "Business logic required data are missing",
		
		401: "Catalog Entry with same DNA detected!",
		
		500: "Nothing to Update!",
		
		601: "Model not found",
		602: "Model error: ",
		
	},
	"schema": {
		
		"commonFields": {
			"start": {
				"required": false,
				"source": ["query.start", "body.start"],
				"default": 0,
				"validation": {
					"type": "integer",
					"min": 0
				}
			},
			"limit": {
				"required": false,
				"source": ["query.limit", "body.limit"],
				"default": 100,
				"validation": {
					"type": "integer",
					"max": 2000
				}
			}
		},
		
		"get": {
			"/ledger/:type": {
				"_apiInfo": {
					"l": "This API returns the ledger entries of a specific type",
					"group": "Ledger"
				},
				"commonFields": ["start", "limit"],
				"type": {
					"source": ["params.type"],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["Registry", "Deployment", "Recipe"]
					}
				}
			}
		},
		
		"delete": {},
		
		"post": {
			"/ledger": {
				"_apiInfo": {
					"l": "This API adds an entry to the ledger of a specific type",
					"group": "Ledger"
				},
				"doc": {
					"source": ["body.doc"],
					"required": true,
					"validation": ledger_doc
				}
			}
		},
		
		"put": {}
		
	}
};