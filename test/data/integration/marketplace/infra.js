'use strict';
let service = {
	type: "service",
	name: "infra",
	configuration: {
		subType: "soajs",
		port: 4008,
		group: "SOAJS Core Services",
		requestTimeout: 30,
		requestTimeoutRenewal: 5
	},
	description: "SOAJS infra",
	metadata: {
		tags: [
			"user management",
			"group management"
		],
		program: [
			"soajs"
		]
	},
	settings: {
		acl: {},
		recipes: [],
		environments: {}
	},
	src: {
		provider: "github",
		owner: "soajs",
		repo: "soajs.infra"
	},
	ui: {
		main: "Gateway",
		sub: ""
	},
	versions: [
		{
			version: "1",
			maintenance: {
				port: {
					type: "maintenance"
				},
				readiness: "/heartbeat",
				commands: [
					{
						label: "Releoad Registry",
						path: "/reloadRegistry",
						icon: "registry"
					},
					{
						label: "Resource Info",
						path: "/resourceInfo",
						icon: "info"
					}
				]
			},
			extKeyRequired: true,
			oauth: true,
			provision_ACL: false,
			tenant_Profile: false,
			urac: true,
			urac_ACL: false,
			urac_Config: false,
			urac_GroupConfig: false,
			urac_Profile: false,
			apis: [
			],
			documentation: {}
		}
	]
};
module.exports = service;