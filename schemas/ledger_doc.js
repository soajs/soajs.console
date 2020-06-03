/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

let config = {
	"type": "object",
	"properties": {
		"type": {
			"type": "string",
			"enum": ["Registry", "Deployment", "Recipe", "Infra"]
		},
		"section": {
			"type": "string",
			"enum": ["Default", "Custom", "Throttling", "Resource configuration", "Catalog", "Continuous delivery", "Cloud and deployment", "Template", "Technology", "Cloud"]
		},
		"locator": {
			"type": "array",
			"minItems": 1,
			"items": {
				"type": "string"
			}
		},
		"action": {
			"type": "string",
			"enum": ["deleted", "updated", "added"]
		},
		"status": {
			"source": ["body.status"],
			"type": "string",
			"enum": ["failed", "succeeded"]
		},
		"header": {
			"source": ['body.header'],
			"type": "object"
		},
		"input": {
			"source": ['body.input'],
			"type": "object"
		},
		"output": {
			"source": ['body.output'],
			"type": "object"
		}
	},
	"required": ["type", "locator", "action", "status", "section"]
};

module.exports = config;