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
    cookie: {maxAge: 1000 * 60 * 60, httpOnly: true}, //1H
    saveUninitialized: false,
    resave : false
}));
app.use(flash());

app.use(express.static('public'));
app.set('view engine','ejs');
app.set('views','views');

// Set Routes
app.use('/',routes);


module.exports = app;