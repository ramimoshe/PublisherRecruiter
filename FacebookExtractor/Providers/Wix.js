var Request = require('request');
var Url = require('url');
var Zlib = require('zlib');
var Async = require('async');
var HttpClient = require('../httpClient');
var _ = require('underscore');

//TODO: add add regex to get 'pages' json section and get the mails from there
var _urlsResourcesStep1Pattern = new RegExp(/"masterPage":.*?]/);
var _urlsResourcesStep2Pattern = new RegExp(/\[.*/);
var _facebookFromJsonPattern = new RegExp(/"http.?:\/\/www.facebook.com\/[a-z|A-z|0-9].*?"/);
var _mailPattern = new RegExp(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);

function findPublisherInfo(url, callback) {
	HttpClient.get(url, function(err, body){
		if (err) { return console.log(err);}
				
		var resourcesUrls = getResourceJson(body);
		if (resourcesUrls == null || resourcesUrls.length == 0) { return console.log("Failed to find facebook from " + url); }
		
		extractFacebookFromUrlResource(resourcesUrls[0], function (facebookUrl) {	
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
					callback(err);
				}
				
				var email = _mailPattern.exec(body);
				if(email != undefined && email != null) { 
					emails.push(email); 
				}
				callback();
			});
		}, function(err){
			if(err) {
			  return console.log('Failed retrive emails ' + err);
			}
			
			var uniqMails = _.uniq(emails);
			callback(uniqMails);
		}
	);
}

function extractFacebookFromUrlResource(urlResourcesJson, callback) {
	HttpClient.get(urlResourcesJson, function(err, body){
		if (err) { return console.log(err);}
		
		var facebook = _facebookFromJsonPattern.exec(body);
		if (facebook instanceof String){
			facebook = facebook.replace('"','');	
		}
		
		callback(facebook);
	});
}

//TODO: extract from all resource (from pages array from the main wix page)
function getResourceJson(html) {
	if (html == null || html == undefined) {
		return null;
	}

	var result = _urlsResourcesStep1Pattern.exec(html);
	if (result == null || result == undefined) {
		return null;
	}

	result = _urlsResourcesStep2Pattern.exec(result);
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
	findPublisherInfo: findPublisherInfo
};