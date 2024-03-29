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
	
	"tags": ["console", "environment", "registry", "ledger", "notification"],
	"attributes": {
		"environment": ["manual", "container"],
		"registry": ["throttling", "custom", "database", "resource configuration"]
	},
	"program": ["soajs"],
	"documentation": {
		"readme": "/README.md",
		"release": "/RELEASE.md"
	},
	"hasher": {
		"hashIterations": 12
	},
	//-------------------------------------
	"bodyParser": {
		"limit": "50mb"
	},
	"errors": {
		400: "Business logic required data are missing",
		401: "Failed to build environment template",
		402: "Unable to find the specified kubernetes account",
		403: "Failed to create namespace",
		404: "Failed to update kubernetes driver environment usage.",
		405: "Failed to update environment, settings provided are not for this type.",
		406: "Failed to create environment, unsupported type.",
		407: "Failed to create environment, port is taken by another environment.",
		
		420: "tenant oAuth User already exists",
		421: "Unable to get tenant oAuth Users",
		
		500: "Nothing to Update!",
		501: "Unable to find the environment deployer data",
		502: "Unable to find the environment",
		503: "Unable to find the environment key data",
		
		601: "Model not found",
		602: "Model error: ",
		802: "SDK error: "
		
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
					"min": 0,
					"max": 2000
				}
			},
			"env": {
				"source": ["body.env", "query.env"],
				"required": true,
				"validation": {
					"type": "string"
				}
			}
		},
		
		"get": {
			"/ledger": {
				"_apiInfo": {
					"l": "This API returns all the ledger entries with the ability to filter entries by env, type and section",
					"group": "Ledger"
				},
				"commonFields": ["start", "limit"],
				"env": {
					"source": ["query.env"],
					"validation": {
						"type": "string"
					}
				},
				"type": {
					"source": ["query.type"],
					"validation": {
						"type": "string",
						"enum": ["Registry", "Deployment", "Notification", "Multitenant"]
					}
				},
				"section": {
					"source": ["query.section"],
					"validation": {
						"type": "string",
						"enum": ["Default", "Custom", "Throttling", "DB", "Resource configuration", "Catalog", "Continuous delivery", "Kubernetes", "Environment", "ACL"]
					}
				}
			},
			
			"/environment": {
				"_apiInfo": {
					"l": "This API returns the environment(s).",
					"group": "Environment"
				},
				"code": {
					"source": ["query.code"],
					"validation": {
						"type": "string"
					}
				},
				"id": {
					"source": ["query.id"],
					"validation": {
						"type": "string"
					}
				}
			},
			"/environment/settings": {
				"_apiInfo": {
					"l": "This API returns the environment settings.",
					"group": "Environment"
				},
				"code": {
					"source": ["query.code"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/release": {
				"_apiInfo": {
					"l": "This API returns the release information.",
					"group": "Settings"
				}
			},
			"/ui/setting": {
				"_apiInfo": {
					"l": "This API returns the ui setting.",
					"group": "Settings"
				}
			},
			
			"/registry": {
				"_apiInfo": {
					"l": "This API gets a registry",
					"group": "Registry"
				},
				"commonFields": ["env"]
			},
			"/registry/key": {
				"_apiInfo": {
					"l": "This API gets a registry key",
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
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API gets all custom registry",
					"group": "Registry"
				},
				"commonFields": ["env"]
			},
			
			"/registry/resource": {
				"_apiInfo": {
					"l": "This API gets all resource configuration",
					"group": "Registry"
				},
				"commonFields": ["env"],
				"type": {
					"source": ["query.type"],
					"validation": {
						"type": "string",
						"enum": ["cluster"]
					}
				},
			},
			"/registry/deployer": {
				"_apiInfo": {
					"l": "This API gets a registry deployer information",
					"group": "Registry"
				},
				"commonFields": ["env"]
			},
			
			"/tenant/oauth/users": {
				_apiInfo: {
					"l": "List tenant oauth users",
					"group": "Oauth"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/dashboard/services": {
				"_apiInfo": {
					"l": "List analytics per service",
					"group": "Analytics"
				},
				"commonFields": ["start", "limit"],
				"type": {
					'source': ['query.type'],
					'required': true,
					'validation': {
						'type': 'array',
						'minItems': 1,
						'items': {
							'type': "string",
						}
					}
				},
				"tags": {
					'source': ['query.tags'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"programs": {
					'source': ['query.programs'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"attributes": {
					'source': ['query.attributes'],
					'validation': {
						'type': 'object',
						"patternProperties": {
							'^/[a-zA-Z0-9_.-]+$': {
								'type': 'array',
								"minItems": 1,
								'items': {
									'type': "string"
								}
							}
						}
					}
				},
				"keywords": {
					'source': ['query.keywords'],
					'validation': {
						'type': 'object',
						"properties": {
							'serviceName': {
								'type': 'string'
							},
							'serviceGroup': {
								'type': 'string'
							}
						}
					}
				},
				"includeSOAJS": {
					'source': ['query.includeSOAJS'],
					'validation': {
						'type': 'boolean'
					}
				},
				"version": {
					'required': true,
					'source': ['query.version'],
					'validation': {
						'type': 'string',
						'enum': ["all", 'latest']
					}
				}
			},
			
			"/dashboard/apis": {
				"_apiInfo": {
					"l": "List analytics per API",
					"group": "Analytics"
				},
				"commonFields": ["start", "limit"],
				"type": {
					'source': ['query.type'],
					'required': true,
					'validation': {
						'type': 'array',
						'minItems': 1,
						'items': {
							'type': "string",
						}
					}
				},
				"tags": {
					'source': ['query.tags'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"programs": {
					'source': ['query.programs'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"attributes": {
					'source': ['query.attributes'],
					'validation': {
						'type': 'object',
						"patternProperties": {
							'^/[a-zA-Z0-9_.-]+$': {
								'type': 'array',
								"minItems": 1,
								'items': {
									'type': "string"
								}
							}
						}
					}
				},
				"includeSOAJS": {
					'source': ['query.includeSOAJS'],
					'validation': {
						'type': 'boolean'
					}
				},
				"keywords": {
					'source': ['query.keywords'],
					'validation': {
						'type': 'object',
						"properties": {
							'serviceName': {
								'type': 'string'
							},
							'serviceGroup': {
								'type': 'string'
							}
						}
					}
				},
				"version": {
					'required': true,
					'source': ['query.version'],
					'validation': {
						'type': 'string',
						'enum': ["all", 'latest']
					}
				}
			},
			
			"/dashboard/apis/v2": {
				"_apiInfo": {
					"l": "List analytics per API",
					"group": "Analytics"
				},
				"commonFields": ["start", "limit"],
				"type": {
					'source': ['query.type'],
					'required': true,
					'validation': {
						'type': 'array',
						'minItems': 1,
						'items': {
							'type': "string",
						}
					}
				},
				"tags": {
					'source': ['query.tags'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"programs": {
					'source': ['query.programs'],
					'validation': {
						'type': 'array',
						"minItems": 1,
						'items': {
							'type': "string"
						}
					}
				},
				"attributes": {
					'source': ['query.attributes'],
					'validation': {
						'type': 'object',
						"patternProperties": {
							'^/[a-zA-Z0-9_.-]+$': {
								'type': 'array',
								"minItems": 1,
								'items': {
									'type': "string"
								}
							}
						}
					}
				},
				"includeSOAJS": {
					'source': ['query.includeSOAJS'],
					'validation': {
						'type': 'boolean'
					}
				},
				"keywords": {
					'source': ['query.keywords'],
					'validation': {
						'type': 'object',
						"properties": {
							'serviceName': {
								'type': 'string'
							},
							'serviceGroup': {
								'type': 'string'
							},
							"route": {
								'type': 'string'
							},
							"serviceVersion": {
								'type': 'string'
							}
						}
					}
				}
			},
			
			"/apis": {
				"_apiInfo": {
					"l": "Complete list of all APIs for all services versions",
					"group": "Analytics"
				},
				"type": {
					'source': ['query.type'],
					'required': true,
					'validation': {
						'type': 'array',
						'minItems': 1,
						'items': {
							'type': "string",
						}
					}
				},
				"includeSOAJS": {
					'source': ['query.includeSOAJS'],
					'validation': {
						'type': 'boolean'
					}
				},
				"keywords": {
					'source': ['query.keywords'],
					'validation': {
						'type': 'object',
						"properties": {
							'serviceName': {
								'type': 'string'
							},
							'serviceGroup': {
								'type': 'string'
							},
							"route": {
								'type': 'string'
							}
						}
					}
				}
			},
			
			"/apis/v2": {
				"_apiInfo": {
					"l": "Complete list of all APIs for all services versions",
					"group": "Analytics"
				},
				"commonFields": ["start", "limit"],
				"type": {
					'source': ['query.type'],
					'required': true,
					'validation': {
						'type': 'array',
						'minItems': 1,
						'items': {
							'type': "string",
						}
					}
				},
				"includeSOAJS": {
					'source': ['query.includeSOAJS'],
					'validation': {
						'type': 'boolean'
					}
				},
				"keywords": {
					'source': ['query.keywords'],
					'validation': {
						'type': 'object',
						"properties": {
							'serviceName': {
								'type': 'string'
							},
							'serviceGroup': {
								'type': 'string'
							},
							"route": {
								'type': 'string'
							},
							"serviceVersion": {
								'type': 'string'
							}
						}
					}
				}
			},
			
			"/api/acl/usage": {
				"_apiInfo": {
					"l": "Complete list the API ACL usage among products and tenants",
					"group": "Analytics"
				},
				"service": {
					'source': ['query.service'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				"version": {
					'source': ['query.version'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				"method": {
					'source': ['query.method'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				"api": {
					'source': ['query.api'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				"apiGroup": {
					'source': ['query.apiGroup'],
					'required': false,
					'validation': {
						'type': 'string'
					}
				}
			},
			"/api/acl/usage/tenants": {
				"_apiInfo": {
					"l": "List analytics per API",
					"group": "Analytics"
				},
				"commonFields": ["start", "limit"],
				"productCode": {
					'source': ['query.productCode'],
					'required': true,
					'validation': {
						'type': 'string'
					}
				},
				"keyword": {
					'source': ['query.keyword'],
					'required': false,
					'validation': {
						'type': 'string'
					}
				}
			},

			"/collections": {
				"_apiInfo": {
					"l": "Fetch the list of collections",
					"group": "Collection"
				},
				"env": {
					"source": ["query.env"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
		},
		
		"delete": {
			"/environment": {
				"_apiInfo": {
					"l": "This API deletes an environment",
					"group": "Environment"
				},
				"code": {
					"source": ["body.code"],
					"validation": {
						"type": "string"
					}
				},
				"id": {
					"source": ["body.id"],
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
			"/environment/acl": {
				"_apiInfo": {
					"l": "This API deletes the environment acl",
					"group": "Environment"
				},
				"code": {
					"source": ["query.code"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/registry/db/custom": {
				"_apiInfo": {
					"l": "This API deletes a custom DB",
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
			"/registry/db/session": {
				"_apiInfo": {
					"l": "This API deletes the session DB",
					"group": "Registry"
				},
				"commonFields": ["env"]
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
				},
				"env": {
					"source": ["body.env"],
					"validation": {
						"type": "string"
					}
				}
			},
			"/registry/custom/acl": {
				"_apiInfo": {
					"l": "This API deletes the custom registry acl",
					"group": "Account"
				},
				"id": {
					"source": ["query.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/registry/resource": {
				"_apiInfo": {
					"l": "This API deletes a resource configuration",
					"group": "Registry"
				},
				"id": {
					"source": ['body.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"env": {
					"source": ["body.env"],
					"validation": {
						"type": "string"
					}
				}
			},
			"/registry/resource/acl": {
				"_apiInfo": {
					"l": "This API deletes the resource configuration acl",
					"group": "Account"
				},
				"id": {
					"source": ["query.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			
			"/tenant/oauth/user": {
				_apiInfo: {
					"l": "Delete tenant oauth user",
					"group": "Oauth"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"uId": {
					"source": ['query.uId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/collection/:id": {
				_apiInfo: {
					"l": "Delete a collection",
					"group": "Collection"
				},
				"id": {
					"source": ['params.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			"/collection/:id/api/:apiId": {
				_apiInfo: {
					"l": "Delete an api from a collection",
					"group": "Collection"
				},
				"id": {
					"source": ["params.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"apiId": {
					"source": ["params.apiId"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
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
										"enum": ["manual"]
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
										"type": "string",
										"pattern": /[a-z0-9]([-a-z0-9]*[a-z0-9])?/
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
					"l": "This API adds a custom DB",
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
							"sharedEnvs": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"value": {
								"anyOf": [
									{"type": "string"},
									{"type": "object"}
								]
							}
						},
						"required": ["name", "plugged", "shared", "value"]
					}
				}
			},
			
			"/registry/resource": {
				"_apiInfo": {
					"l": "This API adds a resource",
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
							"name": {"type": "string", "pattern": /[a-z0-9]{1,61}/},
							"plugged": {"type": "boolean"},
							"shared": {"type": "boolean"},
							"sharedEnvs": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"config": {"type": "object"},
							"type": {
								"type": "string",
								"enum": ['cluster', 'server', 'cdn', 'system', 'authorization', 'other']
							},
							"category": {"type": "string"},
						},
						"required": ["name", "plugged", "shared", "config", "type", "category"]
					}
				}
			},
			
			"/tenant/oauth/user": {
				_apiInfo: {
					"l": "Add tenant oauth user",
					"group": "Oauth"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"userId": {
					"source": ['body.userId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},

			"/collection": {
				"_apiInfo": {
					"l": "Add a collection",
					"group": "Collection"
				},
				"name": {
					"source": ["body.name"],
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
				"env": {
					"source": ["body.env"],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},
			"/collection/:id/api": {
				"_apiInfo": {
					"l": "Add an API to a collection",
					"group": "Collection"
				},
				"id": {
					"source": ["params.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"method": {
					"source": ["body.method"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"name": {
					"source": ["body.name"],
					"validation": {
						"type": "string"
					}
				},
				"api": {
					"source": ["body.api"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"headers": {
					"source": ["body.headers"],
					"validation": {
						"type": "object"
					}
				},
				"body": {
					"source": ["body.body"],
					"validation": {
						"type": "object"
					}
				},
				"params": {
					"source": ["body.params"],
					"validation": {
						"type": "object"
					}
				},
				"query": {
					"source": ["body.query"],
					"validation": {
						"type": "object"
					}
				}
			}
		},
		
		"put": {
			"/environment/acl": {
				"_apiInfo": {
					"l": "This API updates the environment acl",
					"group": "Environment"
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
			
			"/environment": {
				"_apiInfo": {
					"l": "This API updates the environment information",
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
					"validation": {
						"type": "string"
					}
				},
				"settings": {
					"source": ["body.settings"],
					"validation": {
						"type": "object",
						"properties": {
							"namespace": {
								"type": "string"
							},
							"id": {
								"type": "string"
							}
						},
						"required": ["namespace", "id"]
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
						"type": "integer"
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
			"/registry": {
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
											"debug": {"type": "boolean"},
											"getUserFromToken": {"type": "boolean"}
										},
										"required": ["accessTokenLifetime", "refreshTokenLifetime", "getUserFromToken"]
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
			},
			"/registry/custom": {
				"_apiInfo": {
					"l": "This API updates a custom registry",
					"group": "Registry"
				},
				"env": {
					"source": ["body.env"],
					"validation": {
						"type": "string"
					}
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
							"sharedEnvs": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"value": {
								"anyOf": [
									{"type": "string"},
									{"type": "object"}
								]
							}
						},
						"anyOf": [
							{
								"required": ["name"]
							},
							{
								"required": ["plugged"]
							},
							{
								"required": ["shared"]
							},
							{
								"required": ["sharedEnvs"]
							},
							{
								"required": ["value"]
							}
						]
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
			
			"/registry/resource": {
				"_apiInfo": {
					"l": "This API updates a resource configuration",
					"group": "Registry"
				},
				"env": {
					"source": ["body.env"],
					"validation": {
						"type": "string"
					}
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
							"name": {"type": "string", "pattern": /[a-z0-9]{1,61}/},
							"plugged": {"type": "boolean"},
							"shared": {"type": "boolean"},
							"sharedEnvs": {
								"type": "object",
								"patternProperties": {"^[A-Z]+$": {"type": "boolean"}}
							},
							"config": {"type": "object"},
							"type": {
								"type": "string",
								"enum": ['cluster', 'server', 'cdn', 'system', 'authorization', 'other']
							},
							"category": {"type": "string"},
						},
						"anyOf": [
							{
								"required": ["name"]
							},
							{
								"required": ["plugged"]
							},
							{
								"required": ["shared"]
							},
							{
								"required": ["sharedEnvs"]
							},
							{
								"required": ["config"]
							},
							{
								"required": ["type"]
							},
							{
								"required": ["category"]
							}
						]
					}
				}
			},
			"/registry/resource/acl": {
				"_apiInfo": {
					"l": "This API updates the resource configuration acl",
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
			
			"/tenant/oauth/user": {
				_apiInfo: {
					"l": "Update tenant oauth user",
					"group": "Oauth"
				},
				"id": {
					"source": ['query.id'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"uId": {
					"source": ['query.uId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"userId": {
					"source": ['body.userId'],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"password": {
					"source": ['body.password'],
					"required": true,
					"validation": {
						"type": "string"
					}
				}
			},


			"/collection/proxy": {
				"_apiInfo": {
					"l": "Proxy a collection request",
					"group": "Collection"
				},
				"url": {
					"source": ["body.url"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"config": {
					"source": ["body.config"],
					"required": true,
					"validation": {
						"type": "body",
						"required": ["method"],
						"properties": {
							"method": {
								"type": "string"
							},
						}
					}
				}
			},
			"/collection/:id": {
				"_apiInfo": {
					"l": "Update a collection",
					"group": "Collection"
				},
				"id": {
					"source": ["params.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"name": {
					"source": ["body.name"],
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
				}
			},
			"/collection/:id/apis": {
				"_apiInfo": {
					"l": "Update the APIs list of a collection",
					"group": "Collection"
				},
				"id": {
					"source": ["params.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"apis": {
					"source": ["body.apis"],
					"required": true,
					"validation": {
						"type": "array"
					}
				}
			},
			"/collection/:id/api/:apiId": {
				"_apiInfo": {
					"l": "Update the API of a collection",
					"group": "Collection"
				},
				"id": {
					"source": ["params.id"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"apiId": {
					"source": ["params.apiId"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"method": {
					"source": ["body.method"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"name": {
					"source": ["body.name"],
					"validation": {
						"type": "string"
					}
				},
				"api": {
					"source": ["body.api"],
					"required": true,
					"validation": {
						"type": "string"
					}
				},
				"headers": {
					"source": ["body.headers"],
					"validation": {
						"type": "object"
					}
				},
				"body": {
					"source": ["body.body"],
					"validation": {
						"type": "object"
					}
				},
				"params": {
					"source": ["body.params"],
					"validation": {
						"type": "object"
					}
				},
				"query": {
					"source": ["body.query"],
					"validation": {
						"type": "object"
					}
				}
			}
		}
	}
};