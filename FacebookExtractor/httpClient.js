var Http = require('http');
var Url = require('url');
var Zlib = require('zlib');



function get(url, callback) {
	var urlParsed = Url.parse(url);
	var request = Http.get({ host: urlParsed.host,
                         path: urlParsed.path,
                         port: 80,
                         headers: { 'accept-encoding': 'gzip,deflate' } });
						 
	request.on('response', function(response) {
		if (response.statusCode != 200 && response.statusCode != 201) { 
			return console.log("the url " + url + " return status code of " + response.statusCode); 
			}
			
	switch (response.headers['content-encoding']) {
		case 'gzip':
			var buffer = [];
			var gunzip = Zlib.createGunzip();            
			response.pipe(gunzip);
			gunzip.on('data', function(data) {
			    buffer.push(data.toString());
			}).on("end", function() {
				callback(null, buffer.join(""));
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
				callback(null, body);
			});
	  	break;
	}
});
	
	request.on('error', function(err){
		callback(err);
	});
}

module.export = 
	{
		get : get	
	};