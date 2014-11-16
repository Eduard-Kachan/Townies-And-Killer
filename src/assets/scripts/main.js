// Wait for DOM to LoadjQuery(function($) {        // Create New Socket Connection using Socket.io    var socket = io();    var myID;    //users id fo identification    socket.on('myId', function(playerID){        myID = playerID;        console.log(myID);    });    //initial submit off all users    socket.on('initialSubmit', function(users){        console.log(users);        clearUsers('.players');        users.players.forEach(function(player) {            insertUser(player, '.players');        });        clearUsers('.guest');        users.guests.forEach(function(guest) {            insertUser(guest, '.guest');        });    });    //new player joined    socket.on('newPlayer',function(user){        insertUser(user, '.players');    });    //new guest joined    socket.on('newGuest',function(user){        insertUser(user, '.guests');    });    var clearUsers = function(listClass){        var list = $(listClass);        list.empty();    };    var insertUser = function(user,listClass){        var list = $(listClass);        var item = $('<li>');        var name = $('<span>').text(user.name);        if(user.userID == myID){            var nameInput = $('<input>').hide();            ready = $('<button>').text('ready up').attr('class', 'ready');            item.attr('class', 'me')                .append(nameInput)        }else{            ready = $('<span>').text('(Ready)').attr('class', 'ready').hide();        }        item.attr('id', '' + user.userID)            .append(name);        list.append(item);    };    //User clicked on their name to change it    $(document).on ('click', '.me span', function () {        $('.me span').hide();        $('.me .ready').hide();        $('.me input').val($('.me span').text()).show().focus();    });    //User presses 'enter' to submit their name change    $(document).on ('keypress', '.me input', function (e) {        var key = e.which;        if(key == 13)  // the enter key code        {            var value =  $('.me input').val();            $('.me span').text(value).show();            $('.me .ready').show();            $('.me input').hide();            socket.emit('identify', value);        }    });    //change user's name    socket.on('identified', function(user){        $('#' + user.userID + ' span').text(user.name);    });    //remove the user who left    socket.on('remove', function(user){        $('#' + user.userID).remove();    });    socket.on('gameAboutToStart', function(){        console.log('Game about to start!')    });    socket.on('timer', function(time){        console.log('Game about to start!')    });    //socket.on('numOfPplOnline', function(count){    //    console.log(count.players + ' player(s), ' + count.guests + ' guest(s)');    //});    //$(document).on ('click', '.ready', function () {    //    var text = $('.me .ready').text();    //    //    if(text == 'ready up'){    //        $('.me .ready').text('ready');    //        socket.emit('userReady');    //    }else{    //        $('.me .ready').text('ready up');    //        socket.emit('userNotReady');    //    }    //    //});});