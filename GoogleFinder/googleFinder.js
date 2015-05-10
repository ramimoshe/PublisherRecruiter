var https = require("https");
var request = require("request");
var mongoClient = require('mongodb').MongoClient;

var _runningInterval;
var _mongoUrl = 'mongodb://localhost:27017/publisherRecruiter';

var _googleKey;
var _cx;
var _q;
var _baseHost = "https://www.googleapis.com/customsearch/v1?";
var _dateRestrict = "y5";
var _filter = "1";
var _alt = "json";
var _fields = "items(displayLink,fileFormat,formattedUrl,labels,link,title),queries,searchInformation(formattedTotalResults,totalResults),url";
var _totalPages = 2;
var _overrideTotalPages;
var _urlPerPage = 10;

function getSearchUrl(start, count) {
	return _baseHost +
		"filter=" + _filter + "&" +
		"cx=" + _cx + "&" +
		"q=" + _q + "&" +
		"dateRestrict=" + _dateRestrict + "&" +
		"fields=" + _fields + "&" +
		"start" + start + "&" +
		"num" + count + "&" +
		"alt" + _alt + "&" +
		"key=" + _googleKey;
};

/*function start() {
	mongoClient.connect(_mongoUrl, function (err, db) {
		if (err) {
			console.log("Failed connect to db, " + JSON.stringify(err));
			return;
		}

		console.log("Connected correctly to server");
		findUrls(function (res, isLastBulk) {
			insertDocuments(db, res, function () {
				if (isLastBulk) {
					db.close();
					if (_runningInterval == 0) return;
					setTimeout(function() {
						start();
					}, _runningInterval);
				}
		});
	});*/

function start(){
	findUrls(function (res, isLastBulk) {
		send(res.items);
	});
};

function send(items) {
	var headers = {
		'Content-Type': 'application/json'
	}

	var options = {
		url: 'http://localhost:1234/',
		method: 'POST',
		headers: headers,
		form: { items: items }
	};

	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
		}
	});
};

var insertDocuments = function (db, data, callback) {
	var collection = db.collection('rawData');
	collection.insert(data, function (err, result) {
		if (err) {
			console.log("ERROR: " + JSON.stringify(err));
			return;
		}

		console.log("new bulk inserted");
		callback(result);
	});
};

function findUrls(callback) {
	for (var pageNumber = 0; pageNumber < _totalPages; pageNumber++) {
		var startPage;
		if (pageNumber * _urlPerPage == 0) { startPage = 1; } else { startPage = pageNumber * _urlPerPage; };
		var isLastBulk;
		if (pageNumber + 1 == _totalPages) { isLastBulk = true; } else { isLastBulk = false; }

		getRawData(getSearchUrl(startPage, _urlPerPage), isLastBulk, callback);
	}
};

function getRawData(url, pageNumber, callback) {
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var jsonObject = JSON.parse(body);
			_totalPages = _overrideTotalPages || jsonObject.queries.request.totalResults / _urlPerPage;

			callback(jsonObject.items, pageNumber);
		}
	});
};


module.exports = {
	start: function (googleKey, cx, q, runningInterval, overrideTotalPage) {
		_googleKey = googleKey;
		_cx = cx;
		_q = q;
		_runningInterval = runningInterval;
		_overrideTotalPages = overrideTotalPage;

		start();
	}
};



