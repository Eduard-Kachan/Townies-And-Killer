// Require Native Node.js Librariesvar express = require('express');var app = express();var http = require('http').Server(app);var io = require('socket.io')(http);var rooms = {};// ------------------------------------// Route our Assets// ------------------------------------app.use('/assets/', express.static(__dirname + '/public/assets/'));app.use('/scripts/', express.static(__dirname + '/public/assets/scripts'));app.use('/styles/', express.static(__dirname + '/public/assets/styles'));// ------------------------------------// Route to Pages// ------------------------------------// Home Pageapp.get('/', function(req, res){  res.sendFile(__dirname + '/public/index.html');});// Any Room Pageapp.get('/room/*', function(req, res){  //console.log(req.originalUrl);  res.sendFile(__dirname + '/public/room.html');});// ------------------------------------// Handle Socket Connection// ------------------------------------io.on('connection', function(socket) {  console.log('user connected: id=' + socket.id);  var url = socket.handshake.headers.referer.split('/');  var roomName = url[url.length-1];  var room;  var isInARoom = false;  if(url[url.length-2] == 'room'){    isInARoom = true;  }  if(isInARoom){    if(rooms[roomName]){      console.log('room exists: ' + roomName);    }else{      console.log('gonna make a new room: ' + roomName);      rooms[roomName] = new Room();    }    rooms[roomName].roomName = roomName;    rooms[roomName].addUser(socket);    //console.log(rooms);  }});// ------------------------------------// Start Server// ------------------------------------http.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){  var addr = http.address();  console.log("Server started at", addr.address + ":" + addr.port);});// ------------------------------------// Room Object// ------------------------------------function Room() {  this.states = {    waiting:'Waiting For Users',    aboutToStars:'About To Start',    started:'The Game Is Running'  };  this.roomName = undefined;  this.roomState = this.states['waiting'];  this.maxPlayers = 3;  this.capacityReached = false;  this.players = [];  this.guests = [];  this.roomTimer = 0;  this.countDown = null;  this.changeRoomState = function(state){    this.gameState = this.states[state];    this.emitToRoomUsers('gameState', this.gameState);  };  this.addUser = function(socket){    this.addEventListeners(socket);    var isWaiting = this.roomState == this.states['waiting'];    var isCapacityNotReached = this.players.length < this.maxPlayers;    if(isWaiting && isCapacityNotReached) {      this.players.push(socket);      this.broadcastToRoomUsers('newPlayer', {        name:socket.name || 'Anonymous',        userID: socket.id      }, socket);    } else {      this.guests.push(socket);      this.broadcastToRoomUsers('newGuest', {        name: socket.name || 'Anonymous',        userID: socket.id      }, socket);    }    //console.log(this.players);    //console.log(this.guests);    socket.emit('initialSubmit', this.getInitialSubmit(socket.id));    if(!this.capacityReached && this.players.length == this.maxPlayers){      this.capacityReached = true;      this.startCountdown();    }  };  this.getInitialSubmit = function(userID){    var list = {      userID:userID,      gameState:this.roomState,      players:[],      guests:[]    };    //refactored later    this.players.forEach(function(player){      list.players.push({        name:player.name || 'Anonymous',        userID: player.id      });    });    //refactored later    this.guests.forEach(function(guest){      list.guests.push({        name:guest.name || 'Anonymous',        userID: guest.id      });    });    return list;  };  this.removeUser = function(socket){    var indexOfUser;    if(this.players.indexOf(socket) != -1){      indexOfUser = this.players.indexOf(socket);      this.players.splice(indexOfUser, 1);      //if(this.guests.length > 0) {      //  //add guest to players      //  var firstGuest = this.guests.splice(0, 1);      //  players.push(firstGuest[0]);      //  firstGuest[0].emit('player');      //}      //if(players.length < maxPlayers && maxPeopleReached){      //  maxPeopleReached = false;      //}    }else{      indexOfUser = this.guests.indexOf(socket);      this.guests.splice(indexOfUser, 1);    }    //io.emit('remove', {userID:socket.id});  };  this.getNumberOfUsers = function(){    var num = this.players.length + this.guests.length;    return num;  };  this.startCountdown = function(){    var self = this;    this.changeRoomState('aboutToStars');    this.gameTimer = 0;    console.log('game about to start in room: ' + this.roomName);    this.countDown = setInterval(function(){      if(self.roomTimer == 30){        console.log('stop countdown');        clearInterval(self.countDown);        self.changeRoomState('started');        return;      }      console.log(self.roomTimer);      self.emitToRoomUsers('timer', self.roomTimer);      //console.log(self.roomTimer + 's until start in: ' + self.roomName);      self.roomTimer = self.roomTimer + 1;    }, 1000);  };  this.emitToRoomUsers = function(emit, message){    var send = {      emit:emit,      message:message,      fromUser:null    };    this.emitToEvery(this.players, send);    this.emitToEvery(this.guests, send);  };  this.broadcastToRoomUsers = function(emit, message, user){    var send = {      emit:emit,      message:message,      fromUser:user    };    this.emitToEvery(this.players, send);    this.emitToEvery(this.guests, send);  };  this.emitToEvery = function(group, send){    group.forEach(function (socket) {      if(send.fromUser != socket){        socket.emit(send.emit, send.message);      }    });  };  this.addEventListeners = function(socket){    var self = this;    socket.on('disconnect', function(message) {      self.removeUser(socket);      if(self.getNumberOfUsers() == 0){        console.log('No users in room: ' + self.roomName +'. Gonna remove this room');        delete rooms[self.roomName];      }    });    socket.on('identify',function(name){      socket.name = name;      self.broadcastToRoomUsers('identified',{        name:socket.name,        userID: socket.id      }, socket);    });  };}