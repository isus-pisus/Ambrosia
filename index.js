
// Log proxy requests

var express = require('express');
var app = express();
var morgan  = require('morgan');
const passport = require('passport');
const config = require('./config/main'); // database informainton
const Post = require('./models/post'); // schema for chart data point
const Comm = require('./models/comment'); // schema for chart data point
const Image = require('./models/image'); // schema for chart data point
const User = require('./models/user'); // schema for user info
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var http = require('http');
var url = require('url');
var dateFormat = require('dateformat');

var ds18b20 = require('ds18b20');
var io = require('socket.io')();

const requireAuth = passport.authenticate('jwt', { session: false });
mongoose.connect(config.datagetDatabase);

// Initialize passport for use
app.use(passport.initialize());

// Bring in defined Passport Strategy
require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cors());

app.use(function(req, res, next) {
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});
app.use(morgan('dev'));

app.post('/register', function(req, res) {
  console.log(req.body);
  if(!req.body.login || !req.body.email || !req.body.password) {
    res.status(400).json({ success: false, message: 'Please enter email and password.' });
  } else {
    const newUser = new User({
      email: req.body.email,
      username: req.body.login,
      password: req.body.password
    });

    // Attempt to save the user
    newUser.save(function(err) {
      if (err) {
        return res.status(400).json({ success: false, message: 'That email address already exists.'});
      }
      res.status(201).json({ success: true, message: 'Successfully created new user.' });
    });
  }
});

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
app.post('/login', function(req, res) {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          const token = jwt.sign(user, config.secret, {
            expiresIn: 10080 // in seconds
          });
          // console.log(token);
          res.status(200).json({ success: true, token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

// find user and attemp authentication, ruturn status and token

app.post('/token', function(req, res) {
  console.log(req.body.password, req.body.email);
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          const token = jwt.sign(user, config.secret, {
            expiresIn: 10080 // in seconds
          });
          // console.log(token);
          res.status(200).json({ success: true, access_token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

io.on('connection', function(socket){
  // console.log('[+] a user connected');
});
// var temperature = 0;
setInterval(function (){
  var now = new Date();
  var data = {
    timeStamp: dateFormat(now, "h:MM TT"),
    // point: Math.floor((Math.random() * 10) + 70)
    point: ds18b20.temperatureSync('28-00000853833b')
  };

  io.emit('temperature', data);
  // console.log(data);
}, 1000);
io.listen(1724);
app.listen(3000, function(){
    console.log('running on local host 3000');
});

module.exports = app;
