function getFacebookFromUrlResource2(urlResourcesJson, url, callback) {
	//console.log("urlResourcesJson " + urlResourcesJson);
	var urlParsed = Url.parse(urlResourcesJson);
	var request = http.get({ host: urlParsed.host,
                         path: urlParsed.path,
                         port: 80,
                         headers: { 'accept-encoding': 'gzip,deflate' } });
	request.on('response', function(response) {
		//var output = fs.createWriteStream('temp6.txt');
		var writer = new streams.WritableStream();
		
	  switch (response.headers['content-encoding']) {
	    // or, just use zlib.createUnzip() to handle both cases
	    case 'gzip':
	      response.pipe(zlib.createGunzip()).pipe(writer);
	      break;
	    case 'deflate':
	      response.pipe(zlib.createInflate()).pipe(writer);
	      break;
	    default:
	      response.pipe(writer);
	      break;
	  }
	  
	  console.log("!!!!!!! " + writer.toString());
	});
};


function serverHandler(request, reply) {
	//http://static.wixstatic.com//sites//8c63ed_ae54cc77b7c2f4f03ae07ed2a06fb6e3_291.json.z?v=3
	//http:\/\/static.wixstatic.com\/sites\/8c63ed_ae54cc77b7c2f4f03ae07ed2a06fb6e3_291.json.z?v=3
	/*http.get ({
	    host: '127.0.0.1',
	    port: 8888,
	    path: 'http://static.wixstatic.com//sites//8c63ed_ae54cc77b7c2f4f03ae07ed2a06fb6e3_291.json.z?v=3'
	}, function (response) {
	    var body = '';
			response.on('data', function (d) {
				body += d;
			});
			response.on('end', function () {
				try {
					console.log("**********" + body + "**********");
					//var facebook = facebookFromJsonPattern.exec(body);
				} catch (err) {
					console.log("exception - " + err);
				}

			});
	});*/


	for (var i = 0; i < request.payload.items.length; i++) {
		var siteUrl = addHttpIfNotExist(request.payload.items[i].displayLink);
		extractFacebook2(siteUrl, saveData);

	}
	return reply("Done");
};



function extractFacebook2(url, callback) {
	var options = {
	    //host: '127.0.0.1',
	    //port: 8888,
	    path: url,
		headers: {
			'Content-Type': 'text/html;charset=UTF-8',
			'Access-Control-Allow-Origin': '*',
			'accept-encoding': 'gzip'
		}
	};

    http.get(url, function (response) {
			// Continuously update stream with data
			var body = '';
			response.on('data', function (d) {
				body += d;
			});
			response.on('end', function () {

				// Data reception is done, do whatever with it!
				var urlResourcesJson = getResourceJson(body);
				if (urlResourcesJson == null || urlResourcesJson == undefined){
					return;	
				};
				
				getFacebookFromUrlResource3(urlResourcesJson, url, function (facebookUrl) {
					console.log("!!!!!! " + facebookUrl);
					//callback(url, facebookUrl);
				});

			});
		});

};

function getFacebookFromUrlResource(urlResourcesJson, url, callback) {
	request(urlResourcesJson, function (err, res, content) {
		if (err) {
			//console.log("failed to get json resource from " + urlResourcesJson + " err: " + JSON.stringify(err));
		}

		try {
			var facebook = facebookFromJsonPattern.exec(content);
			var fs = require('fs');
			console.log("url failed- " + content + "facebook: " + facebook);
			fs.appendFileSync("temp5.txt", content);
			fs.appendFileSync("temp5.txt", "@@@@@@@@@@@@@@@@@@@@@@" + urlResourcesJson + " && " + url);
			fs.appendFileSync("temp5.txt", "\n\n\n\n\n\n\n\n\n\n\n");

			callback(facebook);
		} catch (err) {
			var fs = require('fs');
			console.log("url failed- " + urlResourcesJson + "\n" + url + "errrrrr: " + err);
			fs.appendFileSync("temp4.txt", content);
			fs.appendFileSync("temp4.txt", "\n\n\n\n\n\n\n\n\n\n\n");

		}
	});
};