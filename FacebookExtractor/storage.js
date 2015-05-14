
var MongoClient = require('mongodb').MongoClient;

var database;

function save(facebookUrl, websiteUrl, email, firstName, lastName, callback){
	var document = createDbDocument(facebookUrl, websiteUrl);
	if (database === undefined || database == null) {
		MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
			if(err) return callback(err);
			
			database = db;
  			insertDocuments(db, document, callback);
		});
	}else{
		insertDocuments(database, document, callback);
	}
}

function insertDocuments(db, callback, callback) {
	var collection = db.collection('customers');
	collection.insert(document, function (err, result) {
		if(err) return callback(err);

		callback();
	});
}

function createDbDocument(facebookUrl, websiteUrl){
	var document = 
		{
			facebookUrl : facebookUrl,
			websiteUrl : websiteUrl
		};
		
	return document;
}

module.exports = 
	{
		save : save
	};