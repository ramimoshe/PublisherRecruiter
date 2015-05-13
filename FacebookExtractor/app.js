var cluster = require('cluster');
var http = require('http');
var request = require('request');
var express = require('express');
var Hapi = require('hapi');
var Url = require('url');
var zlib = require('zlib');
var fs = require('fs');
var streams = require('memory-streams');

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
        path: '/',
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
		extractFacebook(siteUrl, saveData);
	}
	
	return reply("Done");
};

function saveData(websiteUrl, facebookUrl) {
	console.log("data saved websiteUrl: " + websiteUrl + "\nfacebookUrl: " + facebookUrl);
};

function extractFacebook(url, callback) {
	request(url, function (err, res, html) {
		if (err) {
			console.log("failed to get webpage from " + url + " err: " + JSON.stringify(err));
			return;
		}
		
		if (res.statusCode != 200 && res.statusCode != 201) {
			console.log("the url " + url + " return status code of " + res.statusCode);
			return;
		}

		var urlResourcesJson = getResourceJson(html);
		getFacebookFromUrlResource(urlResourcesJson, url, function (facebookUrl) {
			callback(url, facebookUrl);
		});
	});
};

function getFacebookFromUrlResource(urlResourcesJson, url, callback) {
	var urlParsed = Url.parse(urlResourcesJson);
	var request = http.get({ host: urlParsed.host,
                         path: urlParsed.path,
                         port: 80,
                         headers: { 'accept-encoding': 'gzip,deflate' } });
	request.on('response', function(response) {
	  switch (response.headers['content-encoding']) {
	    case 'gzip':
			var buffer = [];
			var gunzip = zlib.createGunzip();            
	        response.pipe(gunzip);
			gunzip.on('data', function(data) {
	            buffer.push(data.toString());
	        }).on("end", function() {
				var facebook = facebookFromJsonPattern.exec(buffer.join(""));
				callback(facebook);
	        }).on("error", function(e) {
	            callback(e);
	        });
	      break;
	    default:		
			var body = '';
			response.on('data', function (d) {
				body += d;
			});
			response.on('end', function () {
				var facebook = facebookFromJsonPattern.exec(body);
				callback(facebook);
			});
	      break;
	  }
	});
};

function addHttpIfNotExist(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
	
    return url;
};

function getResourceJson(html) {
	if (html == null || html == undefined) {
		return null;
	}

	var result = firstPattern.exec(html);
	if (result == null || result == undefined) {
		return null;
	}

	result = secPattern.exec(result);
	var jsonObj = JSON.parse(result);
	if (jsonObj == undefined || jsonObj == null || !(jsonObj instanceof Array)) {
		return null;
	}

	return jsonObj[0].replace("%20", "");
}

var firstPattern = new RegExp(/"masterPage":.*?]/);
var secPattern = new RegExp(/\[.*/);
var facebookFromJsonPattern = new RegExp(/www.facebook.com.*?"/);