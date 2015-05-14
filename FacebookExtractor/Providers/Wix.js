var Request = require('request');
var Url = require('url');
var Zlib = require('zlib');
var HttpClient = require('./httpClient');

var firstPattern = new RegExp(/"masterPage":.*?]/);
var secPattern = new RegExp(/\[.*/);
var facebookFromJsonPattern = new RegExp(/www.facebook.com.*?"/);
var mailPattern = new RegExp(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);

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
		if (urlResourcesJson == null) {
			console.log("Failed to find facebook from " + url);
			return;
		}
		
		extractFacebookFromUrlResource(urlResourcesJson, url, function (facebookUrl) {
			callback(url, facebookUrl);
		});
	});
}

function extractFacebookFromUrlResource(urlResourcesJson, callback) {
	HttpClient.get(urlResourcesJson, function(err, body){
		if (err) { return console.log(err);}
		
		var facebook = facebookFromJsonPattern.exec(body);
		callback(null, facebook);
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