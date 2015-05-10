var cluster = require('cluster');
var http = require('http');
var numOfWorkers = 2;

if (cluster.isMaster){
	for(var i=0; i< numOfWorkers; i++){
		console.log('master: about to form a worker');
		cluster.fork();
	}
	
	cluster.on('fork', function(worker){
		console.log('master: form event (worker ' + worker.id + ')');
	});
	
	cluster.on('online', function(worker){
		console.log('master: online event (worker ' + worker.id + ')');
	});
	
	cluster.on('listening', function(worker, address){
		console.log('master: listening event (worker ' + worker.id + ', pid ' + worker.process.pid + ' address: ' + address.address + ':' + address.port + ')');
	});
	
	cluster.on('exit', function(worker){
		console.log('master: exit event (worker ' + worker.id + ')');
	});
}else{
	console.log('worker: worker #' + cluster.worker.id + ' ready!');
	
	http.createServer(function(req, res){
		res.writeHead(200);
		res.end("hello world from #" + cluster.worker.id + " (pid " + cluster.worker.process.pid + ")");
		
		while(true){
			
		}
	}).listen(1234, 'localhost');
}