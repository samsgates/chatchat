var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
var index = 0;


function findIndexByUID(uid){
  var i;
  for(i = 0; i < users.length; i++){
    if(users[i].id == uid) break;
  }

  if(i == users.length) return -1;
  
  return i;
}

function findUserByUID(uid){
  var index = findIndexByUID(uid);
  if(index == -1) return null;
  
  return users[index];
}


function censor(key, value) {
  if (key == 'socketid') {
    return undefined;
  }
  return value;
}


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/listUsers', function(req, res){
  res.end(JSON.stringify(users, censor));
});

io.on('connection', function(socket){
  var peer;
  console.log('a user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
    var index = users.indexOf(peer);
    if(index != -1){
      var usr = users[index];
      users.splice(index, 1);
      socket.broadcast.emit('user leave', usr.pub);
    }
  });
  
  socket.on('chat message', function(msg){
    if(msg.to == 'all'){
      socket.broadcast.emit('chat message', msg);
    }else{
      var target = findUserByUID(msg.to);
      if(target){
        socket.broadcast.to(target.socketid).emit('chat message', msg);
        //socket_to.emit("chat message", msg);
      }else{
        socket.broadcast.emit("chat message", msg);
      }
    }
    
  });
  
  socket.on('register', function(info){

    if(findUserByUID(info.uuid) == null){
      var usr = {id: info.uuid, name: info.name, socketid: socket.id};
      users.push(usr);
      socket.emit('register succeed', {id: info.uuid, name: info.name});
      socket.broadcast.emit('new user', {id: info.uuid, name: info.name});
      peer = usr;
    }
  
  });
  
});

var server = http.listen(3000, function(){
  var host = server.address().address
  var port = server.address().port
  console.log('listening on http://%s:%s', host, port);
});

