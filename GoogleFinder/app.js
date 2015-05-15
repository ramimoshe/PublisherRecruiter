var Request = require("request");
var Nconf = require('nconf');

Nconf.argv().env().file({ file: './config.json' });

var _runningInterval = Nconf.get("runningInterval");
var _facebookExtractorUrlService = Nconf.get("facebookExtractorUrlService");

var _googleKey = Nconf.get("googleEngine:googleKey");
var _cx = Nconf.get("googleEngine:cx");
var _q = Nconf.get("googleEngine:q");
var _baseHost = Nconf.get("googleEngine:baseHost");
var _dateRestrict = Nconf.get("googleEngine:dateRestrict");
var _filter = Nconf.get("googleEngine:filter");
var _alt = Nconf.get("googleEngine:alt");
var _fields = Nconf.get("googleEngine:fields");
var _totalPages = Nconf.get("totalPages");
var _overrideTotalPages = Nconf.get("overrideTotalPages");;
var _urlPerPage = Nconf.get("googleEngine:urlPerPage");


function start() {
	findUrls(function (res, isLastBulk) {
		send(res);
	});
}

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
}

function send(items) {
	var headers = { 'Content-Type': 'application/json' };

	var options = {
		url: _facebookExtractorUrlService,
		method: 'POST',
		headers: headers,
		form: { items: items }
	};

	Request(options, function (error, response, body) {
		if (error || response.statusCode != 200) {
			console.log("Failed to send request to " + _facebookExtractorUrlService +  
						" exception: " + error);
		}else{
			console.log("response from facebookExtractor: " + body);
		}
	});
}

function findUrls(callback) {
	for (var pageNumber = 0; pageNumber < _totalPages; pageNumber++) {
		var startPage;
		if (pageNumber * _urlPerPage == 0) { startPage = 1; } else { startPage = pageNumber * _urlPerPage; };
		var isLastBulk;
		if (pageNumber + 1 == _totalPages) { isLastBulk = true; } else { isLastBulk = false; }

		getRawData(getSearchUrl(startPage, _urlPerPage), isLastBulk, callback);
	}
}

function getRawData(url, pageNumber, callback) {
	Request(url, function (error, response, body) {
		if (error || response.statusCode != 200) {
			console.log("Failed to send request to " + url + " exception: " + error);
		}

		var jsonObject = JSON.parse(body);
		_totalPages = _overrideTotalPages || jsonObject.queries.request.totalResults / _urlPerPage;

		callback(jsonObject.items, pageNumber);	
	});
}


start();
