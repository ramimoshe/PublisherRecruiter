var Http = require('http');
var Request = require('request');
var Url = require('url');
var Zlib = require('zlib');

var firstPattern = new RegExp(/"masterPage":.*?]/);
var secPattern = new RegExp(/\[.*/);
var facebookFromJsonPattern = new RegExp(/www.facebook.com.*?"/);

function findFacebook(url, callback) {
	Request(url, function (err, res, html) {
		if (err) {
			console.log("failed to get webpage from " + url + " err: " + JSON.stringify(err));
			return;
		}
		
		if (res.statusCode != 200 && res.statusCode != 201) {
			console.log("the url " + url + " return status code of " + res.statusCode);
			return;
		}

		var urlResourcesJson = getResourceJson(html);
		extractFacebookFromUrlResource(urlResourcesJson, url, function (facebookUrl) {
			callback(url, facebookUrl);
		});
	});
}

function extractFacebookFromUrlResource(urlResourcesJson, url, callback) {
	var urlParsed = Url.parse(urlResourcesJson);
	var request = Http.get({ host: urlParsed.host,
                         path: urlParsed.path,
                         port: 80,
                         headers: { 'accept-encoding': 'gzip,deflate' } });
	request.on('response', function(response) {
	  switch (response.headers['content-encoding']) {
	    case 'gzip':
			var buffer = [];
			var gunzip = Zlib.createGunzip();            
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
	  };
	});
}

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


module.exports = {
	findFacebook: findFacebook
};