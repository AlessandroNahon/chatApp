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

io.on('connection', function(socket){
	//Connect
	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);

	client.set('message1', 'hello, yes this is dog');
	client.set('message2', 'no this is spider');

	client.get('message1', function(err, reply){
		console.log(reply);
	});

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
		io.emit('new message', {
			msg: data,
			user: socket.username
		});
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

	function storeMessage(name, data) {
		var message = JSON.stringify({
			name: socket.username, 
			data: data
		});

		console.log('message.name:', message.name);
		// client.lpush('messages', message, function(err,response){
		// 	client.ltrim('messages', 0, 9);
		// });
	}

});



