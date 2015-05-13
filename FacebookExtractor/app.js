var cluster = require('cluster');
var Hapi = require('hapi');
var WixProvider = require('./Providers/Wix.js');

var numOfWorkers = 2;

if (cluster.isMaster) {
	for (var i = 0; i < numOfWorkers; i++) {
		console.log('master: about to form a worker');
		cluster.fork();
	}

	cluster.on('fork', function (worker) {
		console.log('master: form event (worker ' + worker.id + ')');
	});

	cluster.on('online', function (worker) {
		console.log('master: online event (worker ' + worker.id + ')');
	});

	cluster.on('listening', function (worker, address) {
		console.log('master: listening event (worker ' + worker.id + ', pid ' + worker.process.pid + ' address: ' + address.address + ':' + address.port + ')');
	});

	cluster.on('exit', function (worker) {
		console.log('master: exit event (worker ' + worker.id + ')');
	});
} else {
	var server = new Hapi.Server();
	server.connection({
		host: 'localhost',
		port: 1234
	});
	
	server.route({
        method: 'POST',
        path: '/wix',
        config: {
            handler: serverHandler
        }
    });

	server.start();

	console.log('worker: worker #' + cluster.worker.id + ' ready!');
}

function serverHandler(request, reply) {
	for (var i = 0; i < request.payload.items.length; i++) {
		var siteUrl = addHttpIfNotExist(request.payload.items[i].displayLink);
		WixProvider.findFacebook(siteUrl, saveData);
	}
	
	return reply("Done");
}

function saveData(websiteUrl, facebookUrl) {
	console.log("data saved websiteUrl: " + websiteUrl + "\nfacebookUrl: " + facebookUrl);
}

function addHttpIfNotExist(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
	
    return url;
}