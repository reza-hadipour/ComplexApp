const express = require('express');
const app = express();
const cors = require('cors');

const MongoStore = require('connect-mongo');
const session = require('express-session');
const flash = require('connect-flash');
const markDown = require('marked');
const routes = require('./routes/routes');

const {chatApp} = require('./controllers/socketController');


// let onlineUsers = new Map();
// let receiverSocketId = '';

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
chatApp(server,sessionOptions);   // Start chat system


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

// io.engine.use(sessionOptions);  // To access req in socket

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