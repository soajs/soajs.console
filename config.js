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
	"interConnect": [{
		"name": "infra",
		"version": "1"
	}],
	
	//-------------------------------------
	"errors": {
		400: "Business logic required data are missing",
		401: "Failed to build environment template",
		402: "Unable to find the specified kubernetes account",
		403: "Failed to create namespace",
		
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
			},
			"env": {
				"source": ["body.env", "query.env"],
				"required": true,
				"validation": {
					"type": "string"
				}
			},
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
			},
			
			"/environment": {
				"_apiInfo": {
					"l": "This API returns the environment(s).",
					"group": "Account"
				},
				"code": {
					"source": ["query.code"],
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/registry": {
				"_apiInfo": {
					"l": "This API gets a registry",
					"group": "Registry"
				},
				"commonFields": ["env"]
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API gets a custom registry",
					"group": "Registry"
				},
				"commonFields": ["env"]
			},
			"/registry/throttling": {
				"_apiInfo": {
					"l": "This API gets the throttling configuration",
					"group": "Registry"
				},
				"commonFields": ["env"]
			}
		},
		
		"delete": {
			"/environment": {
				"_apiInfo": {
					"l": "This API deletes an environment",
					"group": "Environment"
				},
				"code": {
					"source": ["body.code"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"cleanup": {
					"source": ["body.cleanup"],
					"validation": {
						"type": "boolean",
						"default": false
					}
				}
			},
			
			"/registry/db/custom": {
				"_apiInfo": {
					"l": "This API deletes a custom registry",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"name": {
					"source": ['body.name'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API deletes a custom registry",
					"group": "Registry"
				},
				"id": {
					"source": ['body.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			}
		},
		
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
			},
			"/environment": {
				"_apiInfo": {
					"l": "This API adds an environment",
					"group": "Environment"
				},
				"code": {
					"source": ["body.code"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"description": {
					"source": ["body.description"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"settings": {
					"source": ["body.settings"],
					"required": true,
					"validation": {
						"type": "object",
						"properties": {
							"oneOf": [
								{
									"type": {
										"type": "string",
										"enum": ["local"]
									},
									"port": {
										"type": "integer"
									}
								},
								{
									"type": {
										"type": "string",
										"enum": ["kubernetes"]
									},
									"namespace": {
										"type": "string"
									},
									"id": {
										"type": "string"
									}
								}
							]
						},
						"oneOf": [
							{
								"required": ["type", "port"]
							},
							{
								"required": ["type", "namespace", "id"]
							}
						]
					}
				}
			},
			
			"/registry/db/custom": {
				"_apiInfo": {
					"l": "This API adds a custom registry",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"prefix": {
					"source": ['body.prefix'],
					"required": false,
					"validation": {"type": "string"}
				},
				"name": {
					"source": ['body.name'],
					"required": true,
					"validation": {"type": "string"}
				},
				"cluster": {
					"source": ['body.cluster'],
					"required": true,
					"validation": {"type": "string"}
				},
				"tenantSpecific": {
					"source": ['body.tenantSpecific'],
					"required": false,
					"validation": {"type": "boolean", "default": false}
				}
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API adds a custom registry",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"data": {
					"source": ['body.data'],
					"required": true,
					"validation": {
						"type": "object",
						"additionalProperties": false,
						"properties": {
							"name": {"type": "string"},
							"plugged": {"type": "boolean"},
							"shared": {"type": "boolean"},
							"sharedEnv": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"value": {"type": "object"}
						},
						"required": ["name", "plugged", "shared", "value"]
					}
				}
			}
		},
		
		"put": {
			"/environment/acl": {
				"_apiInfo": {
					"l": "This API updates the environment acl",
					"group": "Account"
				},
				"code": {
					"source": ["body.code"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["blacklist", "whitelist"]
					}
				},
				"groups": {
					"source": ['body.groups'],
					"required": true,
					"validation": {
						"type": "array",
						"minItems": 1
					}
				}
			},
			
			"/registry/db/prefix": {
				"_apiInfo": {
					"l": "This API updates the registry db prefix",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"prefix": {
					"source": ['body.prefix'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			"/registry/db/session": {
				"_apiInfo": {
					"l": "This API updates the registry db session",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"prefix": {
					"source": ['body.prefix'],
					"required": false,
					"validation": {
						"type": "string"
					}
				},
				"name": {
					"source": ['body.name'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"cluster": {
					"source": ['body.cluster'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"store": {
					"source": ['body.store'],
					"required": true,
					"validation": {
						"type": "object"
					}
				},
				"expireAfter": {
					"source": ['body.expireAfter'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"collection": {
					"source": ['body.collection'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"stringify": {
					"source": ['body.stringify'],
					"required": true,
					"validation": {
						"type": "boolean",
						"default": true
					}
				}
			},
			"registry": {
				"_apiInfo": {
					"l": "This API updates a registry",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"domain": {
					"source": ['body.domain'],
					"required": false,
					"validation": {"type": "string"}
				},
				"sitePrefix": {
					"source": ['body.sitePrefix'],
					"required": false,
					"validation": {"type": "string"}
				},
				"apiPrefix": {
					"source": ['body.apiPrefix'],
					"required": false,
					"validation": {"type": "string"}
				},
				"port": {
					"source": ['body.port'],
					"required": false,
					"validation": {"type": "integer"}
				},
				"protocol": {
					"source": ['body.protocol'],
					"required": false,
					"validation": {"type": "string", "enum": ["http", "https"]}
				},
				"description": {
					"source": ['body.description'],
					"required": false,
					"validation": {"type": "string"}
				},
				"services": {
					"source": ['body.services'],
					"required": false,
					"validation": {
						"type": "object",
						"additionalProperties": false,
						"properties": {
							"controller": {
								"type": "object",
								"additionalProperties": false,
								"properties": {
									"authorization": {"type": "boolean"},
									"requestTimeout": {"type": "integer", "min": 20, "max": 60},
									"requestTimeoutRenewal": {"type": "integer", "min": 0}
								},
								"required": ["authorization", "requestTimeout", "requestTimeoutRenewal"]
							},
							"config": {
								"type": "object",
								"additionalProperties": false,
								"properties": {
									"awareness": {
										"type": "object",
										"additionalProperties": false,
										"properties": {
											"cacheTTL": {"type": "integer", "min": 3600},
											"healthCheckInterval": {"type": "integer", "min": 5000},
											"autoRelaodRegistry": {"type": "integer", "min": 60000},
											"maxLogCount": {"type": "integer", "min": 5},
											"autoRegisterService": {"type": "boolean"}
										},
										"required": ["cacheTTL", "healthCheckInterval", "autoRelaodRegistry", "maxLogCount", "autoRegisterService"]
									},
									"logger": {
										"type": "object",
										"additionalProperties": true
									},
									"ports": {
										"type": "object",
										"additionalProperties": false,
										"properties": {
											"controller": {"type": "integer"},
											"maintenanceInc": {"type": "integer", "min": 1000},
											"randomInc": {"type": "integer", "min": 100}
										},
										"required": ["controller", "maintenanceInc", "randomInc"]
									},
									"oauth": {
										"type": "object",
										"additionalProperties": false,
										"properties": {
											"accessTokenLifetime": {"type": "number"},
											"refreshTokenLifetime": {"type": "number"},
											"debug": {"type": "boolean"}
										},
										"required": ["accessTokenLifetime", "refreshTokenLifetime", "debug"]
									},
									"cors": {
										"type": "object",
										"additionalProperties": true
									}
								},
								"required": ["awareness", "logger", "ports", "oauth", "cors"]
							}
						}
					}
				}
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API updates a custom registry",
					"group": "Registry"
				},
				"id": {
					"source": ['body.id'],
					"required": true,
					"validation": {"type": "string"}
				},
				"data": {
					"source": ['body.data'],
					"required": true,
					"validation": {
						"type": "object",
						"additionalProperties": false,
						"properties": {
							"name": {"type": "string"},
							"plugged": {"type": "boolean"},
							"shared": {"type": "boolean"},
							"sharedEnv": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"value": {"type": "object"}
						},
						"required": ["name", "plugged", "shared", "value"]
					}
				}
			},
			"/registry/custom/acl": {
				"_apiInfo": {
					"l": "This API updates the custom registry acl",
					"group": "Account"
				},
				"id": {
					"source": ["body.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ['body.type'],
					"required": true,
					"validation": {
						"type": "string",
						"enum": ["blacklist", "whitelist"]
					}
				},
				"groups": {
					"source": ['body.groups'],
					"required": true,
					"validation": {
						"type": "array",
						"minItems": 1
					}
				}
			},
			"/registry/throttling": {
				"_apiInfo": {
					"l": "This API updates throttling",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"throttling": {
					"source": ['body.throttling'],
					"required": true,
					"validation": {
						"type": "object",
						"properties": {
							"publicAPIStrategy": {"type": "string"},
							"privateAPIStrategy": {"type": "string"},
							"additionalProperties": {
								"type": "object",
								"properties": {
									"type": {"type": "number", "min": 0, "max": 1},
									"window": {"type": "number", "min": 0},
									"limit": {"type": "number", "min": 0},
									"retries": {"type": "number", "min": 0},
									"delay": {"type": "number", "min": 0}
								},
								"required": ["type", "window", "limit", "retries", "delay"]
							}
						}
					}
				}
			}
		}
	}
};