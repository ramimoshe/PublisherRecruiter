var https = require("https");
var request = require("request");
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var googleKey = "AIzaSyDctaGcuexOtvyNDFbespSLhInXAvEiqgU";
var baseHost = "https://www.googleapis.com/customsearch/v1?";
var cx = "010604737292908226044:f7s-wgg22yi";
var q = "facebook";
var dateRestrict = "y5";
var filter = "1";
var alt = "json";
var fields = "items(displayLink,fileFormat,formattedUrl,labels,link,title),queries,searchInformation(formattedTotalResults,totalResults),url";
var totalPages = 2;
var urlPerPage = 50;

function getSearchUrl(start, count) {
	return baseHost +
		"filter=" + filter + "&" +
		"cx=" + cx + "&" +
		"q=" + q + "&" +
		"dateRestrict=" + dateRestrict + "&" +
		"fields=" + fields + "&" +
		"start" + start + "&" +
		"num" + count + "&" +
		"alt" + alt + "&" +
		"key=" + googleKey;
};


var mongoUrl = 'mongodb://localhost:27017/myproject';
mongoClient.connect(mongoUrl, function (err, db) {
	assert.equal(null, err);
	console.log("Connected correctly to server");
	findUrls(function (res) {
		insertDocuments(db, res, function () {
			//db.close();
		});
	});
});

var insertDocuments = function (db, data, callback) {
	var collection = db.collection('rawData');
	collection.insert(data, function (err, result) {
		if (err) {
			console.log("ERROR: " + JSON.stringify(err));
			return;
		}

		console.log("inserted");
		callback(result);
	});
};

function findUrls(callback) {
	for (var pageNumber = 0; pageNumber < totalPages; pageNumber++) {
		var startPage;
		if (pageNumber * urlPerPage == 0) { startPage = 1; } else { startPage = pageNumber * urlPerPage; };
		console.log(getSearchUrl());
		getRawData(getSearchUrl(startPage, urlPerPage), callback);
	}
};

function getRawData(url, callback) {
	/*https.get(url, function (res) {
		console.log("Got response: " + res.statusCode);
		res.on("data", function (data) {
			process.stdout.write("--------------" + data);
			for (var i = 0; i < data.items.length; i++) {
				callback(data.items[i]);
			}
		});

	}).on('error', function (e) {
		console.log("Got error: " + e.message);
	});*/

	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			var jsonObject = JSON.parse(body);
			console.log(Object.keys(jsonObject));		
			for (var i = 0; i < jsonObject.items.length; i++) {
				callback(jsonObject.items[i]);
			}
		}
	});
};




