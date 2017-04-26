var express = require("express");
var mongoose = require("mongoose");
var route = require("./index.js");
var passport = require("passport");
var session = require("express-session");

// require("dotenv").load();
require("./config/passport")(passport);

//connect to database
mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

//initialize epxress
var app = express();

//use ejs as view engine
app.set('view engine', 'ejs');

app.use(session({
    secret:'secretVote',
    resave: false,
    saveUninitialized: true
}));

//use passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/controllers', express.static(__dirname+'/controllers'));
app.use('/assets', express.static(__dirname+'/assets'));

route(app, passport);

var port = process.env.PORT || 8080;
app.listen(port, function(){
    console.log('listening to ' + port);
});