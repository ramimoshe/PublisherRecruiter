var Nconf = require('nconf');
var MongoClient = require('mongodb').MongoClient;

Nconf.argv().env().file({ file: './config.json' });

var _mongoUrl = Nconf.get("mongoUrl");

var _database;

function save(facebookUrl, websiteUrl, title, emails, firstName, lastName, callback){
	var document = createDbDocument(facebookUrl, websiteUrl, title, emails, firstName, lastName);
	if (_database === undefined || _database == null) {
		MongoClient.connect(_mongoUrl, function(err, db) {
			if(err) return callback(err);
			
			_database = db;
  			insertDocuments(db, document, callback);
		});
	}else{
		insertDocuments(_database, document, callback);
	}
}

function insertDocuments(db, document, callback) {
	var collection = db.collection('customers');
	collection.insert(document, function (err, result) {
		if(err) return callback(err);
		callback();
	});
}

function createDbDocument(facebookUrl, websiteUrl, title, emails, firstName, lastName){
	var document = 
		{
			facebookUrl : facebookUrl,
			websiteUrl : websiteUrl,
			title: title,
			emails : emails,
			firstName : firstName,
			lastName : lastName
		};
		
	return document;
}

module.exports = 
	{
		save : save
	};