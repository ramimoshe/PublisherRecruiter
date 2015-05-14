var Request = require('request');
var Url = require('url');
var Zlib = require('zlib');
var Async = require('async');
var HttpClient = require('./httpClient');

var urlsResourcesStep1Pattern = new RegExp(/"masterPage":.*?]/);
var urlsResourcesStep2Pattern = new RegExp(/\[.*/);
var facebookFromJsonPattern = new RegExp(/www.facebook.com.*?"/);
var mailPattern = new RegExp(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);

function findFacebook(url, callback) {
	HttpClient.get(url, function(err, body){
		if (err) { return console.log(err);}
		
		var resourcesUrls = getResourceJson(body);
		if (resourcesUrls == null || resourcesUrls.length == 0) { return console.log("Failed to find facebook from " + url); }
		
		extractFacebookFromUrlResource(resourcesUrls[0], url, function (facebookUrl) {
			extractEmailFromResourcesUrls(resourcesUrls, function (emails){
				callback(url, facebookUrl, emails);	
			});
		});
	});
}

function extractEmailFromResourcesUrls(resourcesUrls, callback) {
	var emails = [];
	Async.each(resourcesUrls, 
		function(url, callback) {
			
			HttpClient.get(url, function(err, body){
				if (err) { 
					console.log(err);
				}
				var email = mailPattern.exec(body);
				if(email != undefined && email != null) { 
					emails.push(email); 
				}
			});
		}, function(err){
			if( err ) {
			  return console.log('Failed retrive emails ' + err);
			}
			
			callback(emails);
		}
	);
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

	var result = urlsResourcesStep1Pattern.exec(html);
	if (result == null || result == undefined) {
		return null;
	}

	result = urlsResourcesStep2Pattern.exec(result);
	var jsonObj = JSON.parse(result);
	if (jsonObj == undefined || jsonObj == null || !(jsonObj instanceof Array)) {
		return null;
	}
	
	for (var i = 0; i < jsonObj.length; i++) {
		jsonObj[i] = jsonObj[i].replace("%20", "");
	}

	return jsonObj;
}


module.exports = {
	findFacebook: findFacebook
};