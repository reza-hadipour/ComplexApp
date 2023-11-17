const express = require('express');
const app = express();
const MongoStore = require('connect-mongo');
const session = require('express-session');
const flash = require('connect-flash');

const routes = require('./routes/routes');

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRETKEY,
    store : MongoStore.create({mongoUrl: process.env.DATABASE_CONNECTION}),
    cookie: {maxAge: 1000 * 60 * 60 * 10, httpOnly: true}, //24H
    saveUninitialized: false,
    resave : false
}));
app.use(flash());

app.use(express.static('public'));
app.set('view engine','ejs');
app.set('views','views');

// To access data in views
app.use((req,res,next)=>{

    // make all success and error flash message access from all template
    res.locals.success = req.flash('success');
    res.locals.errors = req.flash('errors');
    
    // make current user id available on the req object
    req.session.user? req.visitorId = req.session.user.userId : req.visitorId = 0;

    // Let view access the data
    res.locals.user = req.session.user;
    next();
})

// Set Routes
app.use('/',routes);


module.exports = app;