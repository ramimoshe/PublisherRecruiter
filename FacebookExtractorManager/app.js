var request = require("request");
var mongoClient = require('mongodb').MongoClient;

var _mongoUrl = 'mongodb://localhost:27017/publisherRecruiter';


mongoClient.connect(_mongoUrl, function (err, db) {
  if (err) {
    console.log("mongo connection error: " + JSON.stringify(err));
  }

});

var findDocuments = function (db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find({"isProcessed": false}).take(50).toArray(function (err, docs) {
    if (err){
      console.log("failed to query db " + JSON.stringify(err));
    }
    
    callback(docs);
  });
};