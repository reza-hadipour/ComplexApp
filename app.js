const express = require('express');
const app = express();

const routes = require('./routes/routes');

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(express.static('public'));
app.set('view engine','ejs');
app.set('views','views');

// Set Routes
app.use('/',routes);


module.exports = app;