const Socket = require('../models/socket');
const { saveChat, showChats } = require('./chatController');
const Chat = require('../models/chat');

let chatApp = function (server, sessionOptions = {}) {
    let onlineUsers = new Map();
    let receiverSocketId = '';

    // chatApp.initOnlineUsers.bind(this);

    const io = require('socket.io')(server);
    io.engine.use(sessionOptions);  // To access req in socket

    // Private Chat
    io.on('connection', (socket) => {
        console.log('new socket connected ', socket.id);
        let {username : senderUsrename} = socket.request.session?.user;  // Leggin user

        socket.on('saveMe', (senderUserId) => {
            // Add new user into onlineUsers Map
            if (!onlineUsers.has(senderUserId)) {
                onlineUsers.set(senderUserId, socket.id);
                console.log(`${senderUserId} saved in onlineUsers`);
            } else {
                console.log(`${senderUserId} already is in onlineUsers`);
                console.log('onlineUsers: ', onlineUsers);
            }
            // console.log('onlineUsers ', onlineUsers);
        });

        // PrivateChat Request
        socket.on('privateChatReq', async (data) => {

            console.log('Request for: ', data);
            // Check if receiver is online and has socketId
            if (onlineUsers.has(data.receiver)) {
                console.log('I found it in Online Users');
                receiverSocketId = onlineUsers.get(data.receiver) // save receiver to use in privateMessage

                // History
                let history = await Chat.getChats(data.sender,data.receiver).catch(err=>console.error(err));
                // console.log('history: ',history);

                socket.emit('startPrivateChatResp', { receiver: data.receiver, history });
                io.to(receiverSocketId).emit('startPrivateChat', { sender: data.sender, history });
            } else {
                socket.emit('privateChatError', "user is offline");
            }
        })

        // Check receiverSocketId and show message
        socket.on("chatMessage", (data) => {
            if (data.isPrivate === true) {
                let receiver = onlineUsers.get(data.receiver); // Get receiver socketId
                console.log(`privateMessage from ${senderUsrename} [${onlineUsers.get(data.sender)}] to [${onlineUsers.get(data.receiver)}], msg: ${data.text}`);
                io.to(receiver).emit('privateMessage', { sender: senderUsrename, text: data.text });

                // Save messages in chats collection
                new Chat(data.sender, data.receiver, data.text).createChat()
                    .catch(err => console.error(err));

            } else {
                console.error('This message is going nowhere!!')
            }
        })

        // Disconnect event
        socket.on('disconnect', () => {
            onlineUsers.forEach((value, key) => {
                if (value == socket.id) onlineUsers.delete(key);
            })
            console.log(`${socket.id} disconnected`);
            console.log('onlineUsers: ', onlineUsers);
        });

        // Join a room
        // socket.on('joinRoom', (room) => {
        //   console.log(`${socket.id} just joined room ${room}`);

        //   socket.join(room);

        //   io.to(room).emit('roomJoined', `${socket.id} just joined the room`);
        // });

        // Leave a room
        // socket.on('leaveRoom', (room) => {
        //   console.log(`${socket.id} has left room ${room}`);

        //   socket.leave(room);

        //   io.to(room).emit('roomLeft', `${socket.id} has left the room`);
        // });


        // socket.on('chatMessage', (message) => {

        //   console.log(`Received message: ${message.text}`);

        //   // Send the message to other users
        //   socket.broadcast.to(message.room).emit('newMessage', message);

        // });

        // socket.on('privateMessage',(message,recipient)=>{
        //   console.log('Message: ', message);
        //   console.log('Recipient: ', recipient);
        // })



        // Post a message to a specific room
        // socket.on('messageToRoom', (data) => {

        //   console.log(`${socket.id} posted a message to room ${data.room}: ${data.message}`);

        //   io.to(data.room).emit('message', {
        //     id: socket.id,
        //     message: data.message
        //   });

        // });


        // Send a message to all connected clients
        // socket.on('messageToAll', (data) => {
        //   console.log(`${socket.id} sent a message to all clients: ${data.message}`);

        //   io.emit('message', {
        //     id: socket.id,
        //     message: data.message
        //   });  
        // });

    });
}

chatApp.initOnlineUsers = function(){
    Socket.getSockets().then(data => {
        if (data.length > 0) {
            data.forEach(item => {
                this.onlineUsers.set(item.userId, item.socket)
            });
            console.log('onlineUsers initialized: ', this.onlineUsers);
        }
    })
}

let addNewSocket = async (req, res, next) => {
    new Socket(req.body.userId, req.body.socketId).addNewSocket()
        .then(info => res.json(info))
        .catch(err => res.json(err));
}

getSockets = async (req, res, next) => {
    Socket.getSockets().then(data => {
        // console.log(data);

        let onlineUsers = new Map();

        if (data.length > 0) {
            data.forEach(item => {
                onlineUsers.set(item.userId, item.socket)
            });
            console.log('onlineUsers: ', onlineUsers);
            return res.json(data);
        }

        return res.json([]);
    })
        .catch(err => res.json(err))
}

getSocketByUserId = async (req, res, next) => {
    let { userId } = req.query;
    let socket = await Socket.getSocketByUserId(userId);

    if (socket) {
        return res.json(socket);
    }

    return res.json(null)
}


module.exports = {chatApp, addNewSocket, getSockets, getSocketByUserId};