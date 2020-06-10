
let infra_ms = require('./infra-service-mock.js');

infra_ms.startServer({s: {port: 4008}, m: {port: 5008}, name: "infra"}, function (servers) {
	console.log(servers);
});