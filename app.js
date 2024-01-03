const express = require('express');
const app = express();
const cors = require('cors');

const MongoStore = require('connect-mongo');
const session = require('express-session');
const flash = require('connect-flash');
const markDown = require('marked');
const routes = require('./routes/routes');

const {addNewSocket,getSockets,getSocketByUserId} = require('./controllers/socketController');
const {saveChat,showChats} = require('./controllers/chatController');
const Chat = require('./models/chat');

let onlineUsers = new Map();
let receiverSocketId = '';

app.use(cors({origin: { global}}));

app.use(express.urlencoded({extended:true}));
app.use(express.json());

// let sessionOptions = session({
//     secret: process.env.SESSION_SECRETKEY,
//     store : MongoStore.create({mongoUrl: process.env.DATABASE_CONNECTION}),
//     cookie: {maxAge: 1000 * 60 * 60 * 10, httpOnly: true}, //24H
//     saveUninitialized: false,
//     resave : false
// });

let sessionOptions = session({
    secret: process.env.SESSION_SECRETKEY,
    store: MongoStore.create({mongoUrl: process.env.DATABASE_CONNECTION}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
  })

app.use(sessionOptions);
app.use(flash());

app.use(express.static('public'));
app.set('view engine','ejs');
app.set('views','views');

// To access data in views
app.use((req,res,next)=>{

    res.locals.markDownHTML = markDown;

    // make all success and error flash message access from all template
    res.locals.success = req.flash('success');
    res.locals.errors = req.flash('errors');
    
    // make current user id available on the req object
    req.session.user? req.visitorId = req.session.user.userId : req.visitorId = 0; //changed

    // Let view access the data
    res.locals.user = req.session.user;
    next();
})

// Set Routes
app.use('/',routes);

const server = require('http').createServer(app);
const io = require('socket.io')(server);

// convert a connect middleware to a Socket.IO middleware
// const wrap = (middleware) => (socket, next) =>
//   middleware(socket.request, {}, next);

// io.use(wrap(sessionOptions));

// io.use(function(socket,next){
//     if(socket.request.session.user){
//         console.log("In:",socket.request.user);
//         next();
//     }else{
//         console.log('there is no user');
//         next(new Error("unauthorized"));
//     }
// })

io.engine.use(sessionOptions);  // To access req in socket

// io.on('connection', function(socket) {
//     if (socket.request.session.user) {
//       let user = socket.request.session.user
  
//       socket.emit('welcome', {username: user.username, avatar: user.avatar})
  
//       // socket.on('chatMessageFromBrowser', function(data) {
//       //   socket.broadcast.emit('chatMessageFromServer', {message: data.message, username: user.username})
//       // })

//       console.log('Listen to ', user.userId);
//       socket.on(user.userId, function(data) {
//         console.log(data);
//         socket.emit(user.userId, {message: data.message, username: user.username})
//       })

//       // socket.on('655b957b7b637f510572ea93', function(data) {
//       //   socket.emit(data.sender, {message: data.message, username: user.username})
//       // })
//     }
//   })


// Private Chat
io.on('connection', (socket) => {
  console.log('new socket connected ',socket.id);
  console.log(onlineUsers);

  socket.on('saveMe', (senderUserId)=>{
    // Add new user into onlineUsers Map
    if(!onlineUsers.has(senderUserId)){

      onlineUsers.set(senderUserId,socket.id);
      console.log(`${senderUserId} saved in onlineUsers`);

    }else{

      console.log(`${senderUserId} already is in onlineUsers`);
      console.log('onlineUsers: ',onlineUsers);

    }

    console.log('onlineUsers ', onlineUsers);

    socket.emit('welcome',{'senderId':senderUserId, 'senderSocketId':socket.id});

  })

  // PrivateChat Request
  socket.on('privateChatReq',(data)=>{
    console.log('Request for: ',data);
    // Check if receiver is online and has socketId
    if(onlineUsers.has(data.receiver)){
      console.log('I found it in Online Users');
      receiverSocketId = onlineUsers.get(data.receiver) // save receiver to use in privateMessage
      socket.emit('startPrivateChatResp',{receiver: data.receiver});
      io.to(receiverSocketId).emit('startPrivateChat',{sender: data.sender});
    }else{
      socket.emit('privateChatError',"user is offline");
    }
  })

  // Check receiverSocketId and show message
    socket.on("chatMessage",(data)=>{
    if(data.isPrivate === true){
      let receiver = onlineUsers.get(data.receiver); // Get receiver socketId
      let {text} = data;
      console.log(`privateMessage from [${onlineUsers.get(data.sender)}] to [${onlineUsers.get(data.receiver)}], msg: ${text}`);
      io.to(receiver).emit('privateMessage',{sender: data.sender,text});
      new Chat(data.sender,data.receiver,text).createChat()
      .catch(err=>console.error(err));
      
    }else{
      console.error('This message is going nowhere!!')
    }
    })






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

  // Disconnect event
  socket.on('disconnect', () => {
    onlineUsers.forEach((value,key)=>{
      if(value == socket.id) onlineUsers.delete(key);
    })
    console.log(`${socket.id} disconnected`);
    console.log('onlineUsers: ', onlineUsers);
  });

});



// FIRST TRY

// io.on("connect",(socket)=>{
//     // console.log("Some one is connected");
//     console.log(`new connection ${socket.id}`);
//   // User is undefined
//   if(socket.request.session.user){
//       console.log(socket.request.session.user);
    
//         let name = socket.request.session.user?.username || "New User";
//         // console.log(socket);
//         // socket.on('hello',(data)=>{
//         //     console.log(`${name}: ${data.name}`);
//         //     io.emit('getting',{message: "Broadcasted message"})
//         //     socket.emit('welcome',{message:"welcome to chat server"})
//         // })

//         socket.on(socket.request.session.user.userId,(data)=>{
//             console.log(`${data.username}: ${data.message}`);
//             setTimeout(()=>{
//                 socket.emit(data.userId,{message: 'I got your message.', username: name, userId: socket.request.session.user.userId})
//             },1500)
            
//         })
//     }
// })


module.exports = server;