var cluster = require('cluster');
var Hapi = require('hapi');
var Async = require('async');
var Nconf = require('nconf');
var WixProvider = require('./Providers/Wix.js');
var Storage = require('./storage.js');

Nconf.argv().env().file({ file: './config.json' });

var numOfWorkers = Nconf.get("numberOfWorkers");;

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
	Async.each(request.payload.items, 
		function(item, callback) {
			var siteUrl = addHttpIfNotExist(item.displayLink);
			WixProvider.findFacebook(siteUrl, function(websiteUrl, facebookUrl){
				saveData(websiteUrl, facebookUrl, item.title);
			});
		}, function(err){
			if(err) {
			  console.log('Failed retrive data ' + err);
			}
			
			return reply("Done");
		}
	);
}

function addHttpIfNotExist(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
	
    return url;
}

function saveData(websiteUrl, facebookUrl, title) {
	console.log("websiteUrl: " + websiteUrl + "\nfacebookUrl: " + facebookUrl);
	Storage(facebookUrl, websiteUrl, null, null, function(err){
		if (err){
			console.log("Error: " + err);
		}
	});
}