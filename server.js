var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis');
var client = redis.createClient();

users = [];
connections = [];
messages = [];


server.listen(process.env.PORT || 3000, function(){
	console.log('listening on port 3000');
});

app.get('/', function(req,res){
	res.sendFile(__dirname + '/index.html');
});

client.on('connect', function(){
	console.log('connected to redis...');
});

io.on('connection', function(socket){
	//Connect
	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);

	//Disconnect
	socket.on('disconnect', function(data){
		if(!socket.username){
			return false
		} else {
			users.splice(users.indexOf(socket.username),1);
			updateUsernames();
		}
		connections.splice(connections.indexOf(socket),1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});

	//Send Message
	socket.on('send message', function(data){

		function storeMessage(name, msg) {
			var message = JSON.stringify({
				name: socket.username, 
				msg: data
			});

			messages.push(message);
			if(messages.length > 10) {
				messages.shift();
			}

			client.lpush("messages", message, function(err, response) {
			   client.lrange('messages',0, 0, function(err,messages){
			   messages = messages.reverse();

			   	messages.forEach(function(message){
			   		message = JSON.parse(message);
			   		console.log('message:', message);
			   		io.emit('new message', {
			   			msg: message.msg,
			   			user: message.name
			   		});
			   	});
			   });
			});
		}

		storeMessage();
	});

	//New User
	socket.on('new user', function(data, callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
	});

	function updateUsernames() {
		io.emit('get users', users);
	}

});



