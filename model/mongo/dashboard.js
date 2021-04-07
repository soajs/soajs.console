/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by the SOAJS add-on license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";
const marketplace_colName = "marketplace";
const products_colName = "products";
const tenants_colName = "tenants";
const core = require("soajs");
const _ = require("lodash");
const async = require("async");
const soajsLib = require("soajs.core.libs");
const Mongo = core.mongo;

let indexing = {};

function Dashboard(service, options, mongoCore) {
	let __self = this;
	
	if (mongoCore) {
		__self.mongoCore = mongoCore;
	}
	if (!__self.mongoCore) {
		if (options && options.dbConfig) {
			__self.mongoCore = new Mongo(options.dbConfig);
		} else {
			let registry = service.registry.get();
			__self.mongoCore = new Mongo(registry.coreDB.provision);
		}
		
		let index = "default";
		if (options && options.index) {
			index = options.index;
		}
		if (indexing && !indexing[index]) {
			indexing[index] = true;
			
			
			service.log.debug("Dashboard: Indexes for " + index + " Updated!");
		}
	}
}

Dashboard.prototype.get_services = function (data, cb) {
	let __self = this;
	
	let conditions = {};
	let orCond = [];
	
	if (data.tags) {
		orCond.push({'metadata.tags': {'$in': data.tags}});
	}
	if (data.programs) {
		orCond.push({'metadata.program': {'$in': data.programs}});
		if (data.programs.indexOf('no program') !== -1) {
			orCond.push({'metadata.program': {'$exists': 0}});
		}
	}
	if (data.attributes) {
		if (Object.keys(data.attributes).length > 0) {
			for (let att in data.attributes) {
				if (att && data.attributes.hasOwnProperty(att)) {
					orCond.push({["metadata.attributes." + [att]]: {'$in': data.attributes[att]}});
				}
			}
		}
	}
	if (data.keywords) {
		if (Object.keys(data.keywords).length > 0) {
			if (data.keywords.serviceName) {
				orCond.push({"name": data.keywords.serviceName});
			}
			if (data.keywords.serviceGroup) {
				orCond.push({'configuration.group': data.keywords.serviceGroup});
			}
		}
	}
	if (typeof data.type === "string") {
		data.type = [data.type];
	}
	conditions.type = {"$in": data.type};
	if (!data.includeSOAJS) {
		conditions["configuration.subType"] = {'$not': /^soajs$/i};
	}
	
	if (orCond.length > 0) {
		conditions.$or = orCond;
	}
	let fullResponse, queryResponse;
	
	async.series({
		all: function (callback) {
			let pipeline = [
				{
					$match: {"configuration.subType": {'$not': /^soajs$/i}}
				},
				{
					$group:
						{
							_id: 0,
							tags: {$push: '$metadata.tags'},
							attributes: {$mergeObjects: '$metadata.attributes'},
							programs: {$addToSet: '$metadata.program'},
							versions: {$addToSet: '$versions.version'},
						}
				},
				{
					$project: {
						tags: {
							$reduce: {
								input: "$tags",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						attributes: 1,
						programs: {
							$reduce: {
								input: "$programs",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						versions: {
							$reduce: {
								input: "$versions",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						}
					}
				}
			];
			__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (err, cursor) => {
				if (err) {
					return callback(err);
				} else {
					cursor.toArray((err, response) => {
						if (err) {
							return callback(err);
						} else {
							fullResponse = response[0];
							return callback();
						}
					});
				}
			});
		},
		withCondition: function (callback) {
			callMongo(conditions, function (err, response) {
				if (err) {
					return callback(err);
				} else {
					queryResponse = response;
					return callback();
				}
			});
		}
	}, function (err) {
		if (err) {
			return cb(err);
		} else {
			if (fullResponse) {
				queryResponse.tags = fullResponse.tags;
				queryResponse.programs = fullResponse.programs;
				queryResponse.attributes = fullResponse.attributes;
				return cb(null, queryResponse);
			} else {
				return cb(null, queryResponse);
			}
		}
	});
	
	function callMongo(condition, cb) {
		let options = {
			"projection": {
				"deploy": 0,
				"versions.swagger": 0,
				"versions.soa": 0,
				"versions.documentation": 0
			}
		};
		__self.mongoCore.find(marketplace_colName, condition, options, function (error, services) {
			if (error) {
				return cb(error);
			}
			let response = {
				"data": []
			};
			if (data.version === 'latest') {
				latestVersion();
			} else {
				allVersions();
			}
			
			function latestVersion() {
				for (let i = 0; i < services.length; i++) {
					if (!services[i].metadata) {
						services[i].metadata = {};
					}
					if (services[i].name && services[i].configuration.group) {
						if (!services[i].metadata.program || !Array.isArray(services[i].metadata.program) || services[i].metadata.program.length === 0) {
							services[i].metadata.program = ["no program"];
						}
						let serviceObj = {
							"program": services[i].metadata.program,
							"name": services[i].name,
							"type": services[i].type,
							"methods": {
								get: 0,
								post: 0,
								put: 0,
								delete: 0,
								patch: 0,
								head: 0,
								other: 0
							}
						};
						
						let latestVersion = null;
						if (services[i].versions) {
							for (let v = 0; v < services[i].versions.length; v++) {
								if (!latestVersion) {
									latestVersion = services[i].versions[v].version;
								} else {
									latestVersion = soajsLib.version.getLatest(latestVersion, services[i].versions[v].version);
								}
								if (latestVersion === services[i].versions[v].version) {
									serviceObj.version = latestVersion;
									if (services[i].versions[v].apis) {
										serviceObj.APIs = services[i].versions[v].apis.length;
										for (let a = 0; a < services[i].versions[v].apis.length; a++) {
											if (services[i].versions[v].apis[a].m === "get") {
												serviceObj.methods.get++;
											}
											if (services[i].versions[v].apis[a].m === "put") {
												serviceObj.methods.put++;
											}
											if (services[i].versions[v].apis[a].m === "post") {
												serviceObj.methods.post++;
											}
											if (services[i].versions[v].apis[a].m === "delete") {
												serviceObj.methods.delete++;
											}
											if (services[i].versions[v].apis[a].m === "patch") {
												serviceObj.methods.patch++;
											}
											if (services[i].versions[v].apis[a].m === "head") {
												serviceObj.methods.head++;
											}
											if (services[i].versions[v].apis[a].m === "other") {
												serviceObj.methods.other++;
											}
										}
									} else {
										serviceObj.APIs = 0;
									}
								}
							}
						}
						
						for (let p = 0; p < services[i].metadata.program.length; p++) {
							let programPOS = response.data.map(function (e) {
								return e.name;
							}).indexOf(services[i].metadata.program[p]);
							if (programPOS !== -1) {
								if (!response.data[programPOS].groups) {
									response.data[programPOS].groups = [];
								}
								let groupPOS = response.data[programPOS].groups.map(function (e) {
									return e.name;
								}).indexOf(services[i].configuration.group);
								if (groupPOS !== -1) {
									response.data[programPOS].groups[groupPOS].services.push(serviceObj);
								} else {
									let groupObj = {
										"name": services[i].configuration.group,
										"services": []
									};
									groupObj.services.push(serviceObj);
									response.data[programPOS].groups.push(groupObj);
								}
							} else {
								let programObj = {
									"name": services[i].metadata.program[p],
									"groups": []
								};
								let groupObj = {
									"name": services[i].configuration.group,
									"services": []
								};
								groupObj.services.push(serviceObj);
								programObj.groups.push(groupObj);
								response.data.push(programObj);
							}
						}
					}
				}
			}
			
			function allVersions() {
				for (let i = 0; i < services.length; i++) {
					if (!services[i].metadata) {
						services[i].metadata = {};
					}
					let serviceVersions = [];
					if (services[i].name && services[i].configuration.group) {
						if (!services[i].metadata.program || !Array.isArray(services[i].metadata.program) || services[i].metadata.program.length === 0) {
							services[i].metadata.program = ["no program"];
						}
						if (services[i].versions) {
							for (let v = 0; v < services[i].versions.length; v++) {
								let serviceObj = {
									"program": services[i].metadata.program,
									"name": services[i].name,
									"type": services[i].type,
									"methods": {
										get: 0,
										post: 0,
										put: 0,
										delete: 0,
										patch: 0,
										head: 0,
										other: 0
									}
								};
								serviceObj.version = services[i].versions[v].version;
								if (services[i].versions[v].apis) {
									serviceObj.APIs = services[i].versions[v].apis.length;
									for (let a = 0; a < services[i].versions[v].apis.length; a++) {
										if (services[i].versions[v].apis[a].m === "get") {
											serviceObj.methods.get++;
										}
										if (services[i].versions[v].apis[a].m === "put") {
											serviceObj.methods.put++;
										}
										if (services[i].versions[v].apis[a].m === "post") {
											serviceObj.methods.post++;
										}
										if (services[i].versions[v].apis[a].m === "delete") {
											serviceObj.methods.delete++;
										}
										if (services[i].versions[v].apis[a].m === "patch") {
											serviceObj.methods.patch++;
										}
										if (services[i].versions[v].apis[a].m === "head") {
											serviceObj.methods.head++;
										}
										if (services[i].versions[v].apis[a].m === "other") {
											serviceObj.methods.other++;
										}
									}
								} else {
									serviceObj.APIs = 0;
								}
								serviceVersions.push(serviceObj);
							}
						}
					}
					
					for (let p = 0; p < services[i].metadata.program.length; p++) {
						let programPOS = response.data.map(function (e) {
							return e.name;
						}).indexOf(services[i].metadata.program[p]);
						if (programPOS !== -1) {
							if (!response.data[programPOS].groups) {
								response.data[programPOS].groups = [];
							}
							let groupPOS = response.data[programPOS].groups.map(function (e) {
								return e.name;
							}).indexOf(services[i].configuration.group);
							if (groupPOS !== -1) {
								response.data[programPOS].groups[groupPOS].services = response.data[programPOS].groups[groupPOS].services.concat(serviceVersions);
							} else {
								let groupObj = {
									"name": services[i].configuration.group,
									"services": []
								};
								groupObj.services = groupObj.services.concat(serviceVersions);
								response.data[programPOS].groups.push(groupObj);
							}
						} else {
							let programObj = {
								"name": services[i].metadata.program[p],
								"groups": []
							};
							let groupObj = {
								"name": services[i].configuration.group,
								"services": []
							};
							groupObj.services = groupObj.services.concat(serviceVersions);
							programObj.groups.push(groupObj);
							response.data.push(programObj);
						}
					}
				}
			}
			
			return cb(null, response);
		});
	}
};

Dashboard.prototype.get_apis = function (data, cb) {
	let __self = this;
	
	let conditions = {};
	let orCond = [];
	
	if (data.tags) {
		orCond.push({'metadata.tags': {'$in': data.tags}});
	}
	if (data.keywords) {
		if (Object.keys(data.keywords).length > 0) {
			if (data.keywords.serviceName && data.keywords.serviceName !== "") {
				let rePattern = new RegExp(data.keywords.serviceName, 'i');
				orCond.push({'name': {"$regex": rePattern}});
			}
			if (data.keywords.serviceGroup && data.keywords.serviceGroup !== "") {
				let rePattern = new RegExp(data.keywords.serviceGroup, 'i');
				orCond.push({'configuration.group': {"$regex": rePattern}});
			}
		}
	}
	if (data.programs) {
		orCond.push({'metadata.program': {'$in': data.programs}});
		if (data.programs.indexOf('no program') !== -1) {
			orCond.push({'metadata.program': {'$exists': 0}});
		}
	}
	if (data.attributes) {
		if (Object.keys(data.attributes).length > 0) {
			for (let att in data.attributes) {
				if (data.attributes.hasOwnProperty(att)) {
					if (att && data.attributes[att]) {
						orCond.push({["metadata.attributes." + [att]]: {'$in': data.attributes[att]}});
					}
				}
			}
		}
	}
	if (typeof data.type === "string") {
		data.type = [data.type];
	}
	conditions.type = {"$in": data.type};
	
	if (!data.includeSOAJS) {
		conditions["configuration.subType"] = {'$not': /^soajs$/i};
	}
	
	if (orCond.length > 0) {
		conditions.$or = orCond;
	}
	
	let fullResponse, queryResponse;
	async.series({
		all: function (callback) {
			let pipeline = [
				{
					$match: {"configuration.subType": {'$not': /^soajs$/i}}
				},
				{
					$group:
						{
							_id: 0,
							tags: {$push: '$metadata.tags'},
							attributes: {$mergeObjects: '$metadata.attributes'},
							programs: {$addToSet: '$metadata.program'},
							versions: {$addToSet: '$versions.version'},
						}
				},
				{
					$project: {
						tags: {
							$reduce: {
								input: "$tags",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						attributes: 1,
						programs: {
							$reduce: {
								input: "$programs",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						versions: {
							$reduce: {
								input: "$versions",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						}
					}
				}
			];
			__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (err, cursor) => {
				if (err) {
					return callback(err);
				} else {
					cursor.toArray((err, response) => {
						if (err) {
							return callback(err);
						} else {
							fullResponse = response[0];
							return callback();
						}
					});
				}
			});
		},
		withCondition: function (callback) {
			callMongo(conditions, function (err, response) {
				if (err) {
					return callback(err);
				} else {
					queryResponse = response;
					return callback();
				}
			});
		}
	}, function (err) {
		if (err) {
			return cb(err);
		} else {
			if (fullResponse) {
				queryResponse.tags = fullResponse.tags;
				queryResponse.programs = fullResponse.programs;
				queryResponse.attributes = fullResponse.attributes;
				return cb(null, queryResponse);
			} else {
				return cb(null, queryResponse);
			}
		}
	});
	
	function findVersion(versions, v) {
		return versions.find(element => element.version === v);
	}
	
	function callMongo(condition, cb) {
		let options = {
			"projection": {
				"deploy": 0,
				"versions.swagger": 0,
				"versions.soa": 0,
				"versions.documentation": 0
			}
		};
		__self.mongoCore.find(marketplace_colName, condition, options, function (error, services) {
			if (error) {
				return cb(error);
			}
			let response = {
				"data": []
			};
			
			if (data.version === 'latest') {
				latestVersion();
			} else {
				allVersions();
			}
			
			function latestVersion() {
				for (let i = 0; i < services.length; i++) {
					if (services[i].name && services[i].configuration.group) {
						if (services[i].versions && services[i].versions.length > 0) {
							let v = null;
							for (let x = 0; x < services[i].versions.length; x++) {
								if (!v) {
									v = services[i].versions[x].version;
								} else {
									v = soajsLib.version.getLatest(v, services[i].versions[x].version);
								}
							}
							let version = findVersion(services[i].versions, v);
							if (version && version.apis && version.apis.length) {
								for (let k = 0; k < version.apis.length; k++) {
									response.data.push({
										serviceName: services[i].name,
										type: services[i].type,
										route: version.apis[k].v,
										label: version.apis[k].l,
										method: version.apis[k].m ? version.apis[k].m : 'get',
										group: version.apis[k].group,
										v: v
									});
								}
							}
						}
						response.data = _.orderBy(response.data, ["route"], ['asc']);
					}
				}
			}
			
			function allVersions() {
				for (let i = 0; i < services.length; i++) {
					if (services[i].name && services[i].configuration.group) {
						if (services[i].versions && services[i].versions.length > 0) {
							for (let x = 0; x < services[i].versions.length; x++) {
								let version = services[i].versions[x];
								if (version && version.apis && version.apis.length) {
									for (let k = 0; k < version.apis.length; k++) {
										response.data.push({
											serviceName: services[i].name,
											type: services[i].type,
											route: version.apis[k].v,
											label: version.apis[k].l,
											method: version.apis[k].m ? version.apis[k].m : 'get',
											group: version.apis[k].group,
											v: version.version
										});
									}
								}
							}
						}
						response.data = _.orderBy(response.data, ["route"], ['asc']);
					}
				}
			}
			
			return cb(null, response);
		});
	}
};

Dashboard.prototype.get_apis_v2 = function (data, cb) {
	let __self = this;
	
	let conditions = {};
	let orCond = [];
	
	if (data.tags) {
		orCond.push({'metadata.tags': {'$in': data.tags}});
	}
	let routeCondition = null;
	if (data.keywords) {
		if (Object.keys(data.keywords).length > 0) {
			if (data.keywords.serviceName && data.keywords.serviceName !== "") {
				let rePattern = new RegExp(data.keywords.serviceName, 'i');
				orCond.push({'name': {"$regex": rePattern}});
			}
			if (data.keywords.serviceGroup && data.keywords.serviceGroup !== "") {
				let rePattern = new RegExp(data.keywords.serviceGroup, 'i');
				orCond.push({'configuration.group': {"$regex": rePattern}});
			}
			if (data.keywords.route && data.keywords.route !== "") {
				let rePattern = new RegExp(data.keywords.route, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.route = {"$regex": rePattern};
			}
			if (data.keywords.serviceVersion && data.keywords.serviceVersion !== "") {
				let rePattern = new RegExp(data.keywords.serviceVersion, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.v = {"$regex": rePattern};
			}
		}
	}
	if (data.programs) {
		orCond.push({'metadata.program': {'$in': data.programs}});
		if (data.programs.indexOf('no program') !== -1) {
			orCond.push({'metadata.program': {'$exists': 0}});
		}
	}
	if (data.attributes) {
		if (Object.keys(data.attributes).length > 0) {
			for (let att in data.attributes) {
				if (data.attributes.hasOwnProperty(att)) {
					if (att && data.attributes[att]) {
						orCond.push({["metadata.attributes." + [att]]: {'$in': data.attributes[att]}});
					}
				}
			}
		}
	}
	if (typeof data.type === "string") {
		data.type = [data.type];
	}
	conditions.type = {"$in": data.type};
	
	if (!data.includeSOAJS) {
		conditions["configuration.subType"] = {'$not': /^soajs$/i};
	}
	
	if (orCond.length > 0) {
		conditions.$or = orCond;
	}
	
	let fullResponse, queryResponse;
	async.series({
		all: function (callback) {
			let pipeline = [
				{
					$match: {"configuration.subType": {'$not': /^soajs$/i}}
				},
				{
					$group:
						{
							_id: 0,
							tags: {$push: '$metadata.tags'},
							attributes: {$mergeObjects: '$metadata.attributes'},
							programs: {$addToSet: '$metadata.program'},
							versions: {$addToSet: '$versions.version'},
						}
				},
				{
					$project: {
						tags: {
							$reduce: {
								input: "$tags",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						attributes: 1,
						programs: {
							$reduce: {
								input: "$programs",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						},
						versions: {
							$reduce: {
								input: "$versions",
								initialValue: [],
								in: {$setUnion: ["$$value", "$$this"]}
							}
						}
					}
				}
			];
			__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (err, cursor) => {
				if (err) {
					return callback(err);
				} else {
					cursor.toArray((err, response) => {
						if (err) {
							return callback(err);
						} else {
							fullResponse = response[0];
							return callback();
						}
					});
				}
			});
		},
		withCondition: function (callback) {
			let pipeline = [
				{$match: conditions},
				{
					$project: {
						"deploy": 0,
						"versions.swagger": 0,
						"versions.soa": 0,
						"versions.documentation": 0
					}
				},
				{$unwind: "$versions"},
				{$unwind: "$versions.apis"},
				{
					$project: {
						"name": 1,
						"configuration.group": 1,
						"type": 1,
						"versions.version": 1,
						"versions.apis.l": 1,
						"versions.apis.v": 1,
						"versions.apis.m": 1,
						"versions.apis.group": 1
					}
				},
				{
					$addFields: {
						"serviceName": "$name",
						"group": "$configuration.group",
						"route": "$versions.apis.v",
						"method": "$versions.apis.m",
						"label": "$versions.apis.l",
						"apiGroup": "$versions.apis.group",
						"v": "$versions.version"
					}
				},
				{
					$project: {
						"name": 0,
						"configuration": 0,
						"versions": 0
					}
				}
			];
			if (routeCondition) {
				pipeline.push({$match: routeCondition});
			}
			let countPipeline = [...pipeline];
			countPipeline.push({$count: "count"});
			__self.mongoCore.aggregate(marketplace_colName, countPipeline, {}, (error, cursor) => {
				if (error) {
					return callback(error);
				} else {
					cursor.toArray((error, countResponse) => {
						if (error) {
							return callback(error);
						} else {
							pipeline.push({$sort: {"route": 1}});
							pipeline.push({$skip: data.start || 0});
							pipeline.push({$limit: data.limit || 1000});
							__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (error, cursor) => {
								if (error) {
									return callback(error);
								} else {
									cursor.toArray((error, recordsResponse) => {
										if (error) {
											return callback(error);
										} else {
											let response = {
												limit: data.limit || 1000,
												start: data.start || 0,
												count: (countResponse && countResponse[0] ? countResponse[0].count : 0),
												records: recordsResponse
											};
											queryResponse = response;
											return callback(null);
										}
									});
								}
							});
						}
					});
				}
			});
		}
	}, function (err) {
		if (err) {
			return cb(err);
		} else {
			if (fullResponse) {
				queryResponse.tags = fullResponse.tags;
				queryResponse.programs = fullResponse.programs;
				queryResponse.attributes = fullResponse.attributes;
				return cb(null, queryResponse);
			} else {
				return cb(null, queryResponse);
			}
		}
	});
};

Dashboard.prototype.get_apis_all_versions = function (data, cb) {
	let __self = this;
	let orCond = [];
	let conditions = {"type": {"$in": data.type}};
	if (!data.includeSOAJS) {
		conditions["configuration.subType"] = {'$not': /^soajs$/i};
	}
	let routeCondition = null;
	if (data.keywords) {
		if (Object.keys(data.keywords).length > 0) {
			if (data.keywords.serviceName && data.keywords.serviceName !== "") {
				let rePattern = new RegExp(data.keywords.serviceName, 'i');
				orCond.push({'name': {"$regex": rePattern}});
			}
			if (data.keywords.serviceGroup && data.keywords.serviceGroup !== "") {
				let rePattern = new RegExp(data.keywords.serviceGroup, 'i');
				orCond.push({'configuration.group': {"$regex": rePattern}});
			}
			if (data.keywords.route && data.keywords.route !== "") {
				let rePattern = new RegExp(data.keywords.route, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.route = {"$regex": rePattern};
			}
			if (data.keywords.serviceVersion && data.keywords.serviceVersion !== "") {
				let rePattern = new RegExp(data.keywords.serviceVersion, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.v = {"$regex": rePattern};
			}
		}
	}
	
	if (orCond.length > 0) {
		conditions.$or = orCond;
	}
	let pipeline = [
		{$match: conditions},
		{
			$project: {
				"deploy": 0,
				"versions.swagger": 0,
				"versions.soa": 0,
				"versions.documentation": 0
			}
		},
		{$unwind: "$versions"},
		{$unwind: "$versions.apis"},
		{
			$project: {
				"name": 1,
				"configuration.group": 1,
				"type": 1,
				"versions.version": 1,
				"versions.apis.l": 1,
				"versions.apis.v": 1,
				"versions.apis.m": 1,
				"versions.apis.group": 1
			}
		},
		{
			$addFields: {
				"serviceName": "$name",
				"group": "$configuration.group",
				"route": "$versions.apis.v",
				"method": "$versions.apis.m",
				"label": "$versions.apis.l",
				"apiGroup": "$versions.apis.group",
				"v": "$versions.version"
			}
		},
		{
			$project: {
				"name": 0,
				"configuration": 0,
				"versions": 0
			}
		}
	];
	if (routeCondition) {
		pipeline.push({$match: routeCondition});
	}
	pipeline.push({$sort: {"route": 1}});
	pipeline.push({$limit: 1000});
	
	__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (error, cursor) => {
		if (error) {
			return cb(error, null);
		} else {
			cursor.toArray((error, response) => {
				if (error) {
					return cb(error, null);
				} else {
					return cb(null, response);
				}
			});
		}
	});
};

Dashboard.prototype.get_apis_all_versions_v2 = function (data, cb) {
	let __self = this;
	let orCond = [];
	let conditions = {"type": {"$in": data.type}};
	if (!data.includeSOAJS) {
		conditions["configuration.subType"] = {'$not': /^soajs$/i};
	}
	let routeCondition = null;
	if (data.keywords) {
		if (Object.keys(data.keywords).length > 0) {
			if (data.keywords.serviceName && data.keywords.serviceName !== "") {
				let rePattern = new RegExp(data.keywords.serviceName, 'i');
				orCond.push({'name': {"$regex": rePattern}});
			}
			if (data.keywords.serviceGroup && data.keywords.serviceGroup !== "") {
				let rePattern = new RegExp(data.keywords.serviceGroup, 'i');
				orCond.push({'configuration.group': {"$regex": rePattern}});
			}
			if (data.keywords.route && data.keywords.route !== "") {
				let rePattern = new RegExp(data.keywords.route, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.route = {"$regex": rePattern};
			}
			if (data.keywords.serviceVersion && data.keywords.serviceVersion !== "") {
				let rePattern = new RegExp(data.keywords.serviceVersion, 'i');
				if (!routeCondition) {
					routeCondition = {};
				}
				routeCondition.v = {"$regex": rePattern};
			}
		}
	}
	
	if (orCond.length > 0) {
		conditions.$or = orCond;
	}
	let pipeline = [
		{$match: conditions},
		{
			$project: {
				"deploy": 0,
				"versions.swagger": 0,
				"versions.soa": 0,
				"versions.documentation": 0
			}
		},
		{$unwind: "$versions"},
		{$unwind: "$versions.apis"},
		{
			$project: {
				"name": 1,
				"configuration.group": 1,
				"type": 1,
				"versions.version": 1,
				"versions.apis.l": 1,
				"versions.apis.v": 1,
				"versions.apis.m": 1,
				"versions.apis.group": 1
			}
		},
		{
			$addFields: {
				"serviceName": "$name",
				"group": "$configuration.group",
				"route": "$versions.apis.v",
				"method": "$versions.apis.m",
				"label": "$versions.apis.l",
				"apiGroup": "$versions.apis.group",
				"v": "$versions.version"
			}
		},
		{
			$project: {
				"name": 0,
				"configuration": 0,
				"versions": 0
			}
		}
	];
	if (routeCondition) {
		pipeline.push({$match: routeCondition});
	}
	let countPipeline = [...pipeline];
	countPipeline.push({$count: "count"});
	__self.mongoCore.aggregate(marketplace_colName, countPipeline, {}, (error, cursor) => {
		if (error) {
			return cb(error, null);
		} else {
			cursor.toArray((error, countResponse) => {
				if (error) {
					return cb(error, null);
				} else {
					pipeline.push({$sort: {"route": 1}});
					pipeline.push({$skip: data.start || 0});
					pipeline.push({$limit: data.limit || 1000});
					__self.mongoCore.aggregate(marketplace_colName, pipeline, {}, (error, cursor) => {
						if (error) {
							return cb(error, null);
						} else {
							cursor.toArray((error, recordsResponse) => {
								if (error) {
									return cb(error, null);
								} else {
									let response = {
										limit: data.limit || 1000,
										start: data.start || 0,
										count: (countResponse && countResponse[0] ? countResponse[0].count : 0),
										records: recordsResponse
									};
									return cb(null, response);
								}
							});
						}
					});
				}
			});
		}
	});
};

Dashboard.prototype.get_api_acl_usage = function (data, cb) {
	let __self = this;
	
	let servicename = data.service;
	let version = data.version;
	let version_sanitized = data.version;
	let method = data.method;
	let api = data.api;
	let group = data.apiGroup;
	
	let pipeline = [
		{
			$match: {}
		},
		{
			$addFields: {
				"found_in_scope": {
					$function: {
						"body": 'function (scope, servicename, version, method, api) {\
							let found_in_env = {"envs": [], "apisPermission": []};\
							if (scope && scope.acl) {\
								for (let e in scope.acl) {\
									if (scope.acl[e][servicename] && scope.acl[e][servicename][version]) {\
										let o = scope.acl[e][servicename][version];\
										if (!o.apisPermission || o.apisPermission !== "restricted") {\
											found_in_env.envs.push(e);\
										} else {\
											if (o[method]) {\
												for (let a = 0; a < o[method].length; a++) {\
													if (o[method][a].apis && o[method][a].apis[api]) {\
														found_in_env.envs.push(e);\
														found_in_env.apisPermission.push(e);\
													}\
												}\
											}\
										}\
									}\
								}\
							}\
							return found_in_env;\
						}',
						args: ["$scope", servicename, version, method, api],
						lang: "js"
					}
				}
			}
		},
		{
			$addFields: {
				"found_in_package": {
					$function: {
						"body": 'function (packages, servicename, version, method, api, group, version_sanitized, found_in_scope) {\
							let found_in_env = {\
								"packages": [],\
								"environments": [],\
								"envs": {}\
							};\
							if (packages) {\
								for (let i = 0; i < packages.length; i++) {\
									if (packages[i].acl) {\
										for (let e in packages[i].acl) {\
											if (packages[i].aclTypeByEnv && packages[i].aclTypeByEnv[e] === "granular") {\
												if (packages[i].acl[e][servicename] && packages[i].acl[e][servicename][version_sanitized]) {\
													let o = packages[i].acl[e][servicename][version_sanitized];\
													if (!o.apisPermission || o.apisPermission !== "restricted") {\
														if (!found_in_env.envs[packages[i].code]) {\
															found_in_env.envs[packages[i].code] = [];\
														}\
														found_in_env.envs[packages[i].code].push(e);\
														if (!found_in_env.environments.includes(e)) {\
															found_in_env.environments.push(e);\
														}\
														if (!found_in_env.packages.includes(packages[i].code)) {\
															found_in_env.packages.push(packages[i].code);\
														}\
													} else {\
														if (o[method]) {\
															for (let a = 0; a < o[method].length; a++) {\
																if (o[method][a].apis && o[method][a].apis[api]) {\
																	if (!found_in_env.envs[packages[i].code]) {\
																		found_in_env.envs[packages[i].code] = [];\
																	}\
																	found_in_env.envs[packages[i].code].push(e);\
																	if (!found_in_env.environments.includes(e)) {\
																		found_in_env.environments.push(e);\
																	}\
																	if (!found_in_env.packages.includes(packages[i].code)) {\
																		found_in_env.packages.push(packages[i].code);\
																	}\
																}\
															}\
														}\
													}\
												}\
											} else {\
												if (packages[i].acl[e][servicename]) {\
													for (let j = 0; j < packages[i].acl[e][servicename].length; j++) {\
														if (packages[i].acl[e][servicename][j].version === version) {\
															if (group && packages[i].acl[e][servicename][j][method] && packages[i].acl[e][servicename][j][method].includes(group)) {\
																if (!found_in_env.envs[packages[i].code]) {\
																	found_in_env.envs[packages[i].code] = [];\
																}\
																found_in_env.envs[packages[i].code].push(e);\
																if (!found_in_env.environments.includes(e)) {\
																	found_in_env.environments.push(e);\
																}\
																if (!found_in_env.packages.includes(packages[i].code)) {\
																	found_in_env.packages.push(packages[i].code);\
																}\
															} else {\
																if (!found_in_scope.apisPermission.includes(e)){\
																	if (!found_in_env.envs[packages[i].code]) {\
																		found_in_env.envs[packages[i].code] = [];\
																	}\
																	found_in_env.envs[packages[i].code].push(e);\
																	if (!found_in_env.environments.includes(e)) {\
																		found_in_env.environments.push(e);\
																	}\
																	if (!found_in_env.packages.includes(packages[i].code)) {\
																		found_in_env.packages.push(packages[i].code);\
																	}\
																}\
															}\
														}\
													}\
												}\
											}\
										}\
									}\
								}\
							}\
							return found_in_env;\
						}',
						args: ["$packages", servicename, version, method, api, group, version_sanitized, "$found_in_scope"],
						lang: "js"
					}
				}
			}
		},
		{
			$project: {
				"name": "$name",
				"code": "$code",
				"found_in_scope": 1,
				"found_in_package": 1
			}
		},
		{
			$match: {
				$or: [{
					"found_in_package.packages": {
						$exists: true,
						$not: {$size: 0}
					}
				}, {"found_in_scope.envs": {$exists: true, $not: {$size: 0}}}]
			}
		},
		{
			$lookup:
				{
					from: tenants_colName,
					let: {"p_code": "$code"},
					pipeline: [
						{
							$unwind: "$applications"
						},
						{
							$unwind: {path: "$applications.keys", preserveNullAndEmptyArrays: true}
						},
						{
							$unwind: {path: "$applications.keys.extKeys", preserveNullAndEmptyArrays: true}
						},
						{
							$match: {$expr: {$eq: ["$applications.product", "$$p_code"]}}
						},
						{
							$project: {
								"code": 1,
								"name": 1,
								"applications.product": 1,
								"applications.package": 1,
								"applications.key.extKey": "$applications.keys.extKeys.extKey",
								"applications.key.env": "$applications.keys.extKeys.env"
							}
						},
						{
							$group: {
								_id: {code: "$code", name: "$name"},
								applications: {$push: "$applications"}
							}
						},
						{
							$project: {
								"code": "$_id.code",
								"name": "$_id.name",
								"applications": 1,
								"_id": 0
							}
						}
					],
					as: "tenants"
				}
		}
	];
	
	__self.mongoCore.aggregate(products_colName, pipeline, {}, (err, cursor) => {
		if (err) {
			return cb(err, null);
		} else {
			cursor.toArray((err, response) => {
				return cb(err, response);
			});
		}
	});
};

Dashboard.prototype.closeConnection = function () {
	let __self = this;
	__self.mongoCore.closeDb();
};

module.exports = Dashboard;