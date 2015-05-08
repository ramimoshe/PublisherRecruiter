var https = require("https");
var request = require("request");
var mongoClient = require('mongodb').MongoClient;

var mongoUrl = 'mongodb://localhost:27017/publisherRecruiter';

var googleKey = "AIzaSyDctaGcuexOtvyNDFbespSLhInXAvEiqgU";
var baseHost = "https://www.googleapis.com/customsearch/v1?";
var cx = "010604737292908226044:f7s-wgg22yi";
var q = '"http://static.wixstatic.com"';
var dateRestrict = "y5";
var filter = "1";
var alt = "json";
var fields = "items(displayLink,fileFormat,formattedUrl,labels,link,title),queries,searchInformation(formattedTotalResults,totalResults),url";
var totalPages = 2;
var urlPerPage = 10;

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

mongoClient.connect(mongoUrl, function (err, db) {
	if (err){
		console.log("Failed connect to db, " + JSON.stringify(err));
		return;
	}
	
	console.log("Connected correctly to server");
	findUrls(function (res, isLastBulk) {
		insertDocuments(db, res, function () {
			if (isLastBulk){
				db.close();
			}
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
		var isLastBulk;
		if (pageNumber + 1 == totalPages) { isLastBulk = true; } else { isLastBulk = false; }
		
		getRawData(getSearchUrl(startPage, urlPerPage), isLastBulk, callback);
	}
};

function getRawData(url, pageNumber, callback) {
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var jsonObject = JSON.parse(body);	
			
			callback(jsonObject.items, pageNumber);
		}
	});
};




