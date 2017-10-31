require('./config/dev');
var morgan  = require('morgan');
var express = require('express');
const passport = require('passport');
const config = require('./config/main'); // database informainton
const Post = require('./models/post'); // schema for chart data point
const Data_point = require('./models/data'); // schema for chart data point
const Image = require('./models/image'); // schema for chart data point
const User = require('./models/user'); // schema for user info
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var http = require('http');
var url = require('url');
var dateFormat = require('dateformat');
var unix = require('to-unix-timestamp');
var shortid = require('shortid');
var app = express();

 // sensors
var sensorLib = require('node-dht-sensor');
var ds18b20 = require('ds18b20');
var rpiDhtSensor = require('rpi-dht-sensor');


var io = require('socket.io')();

const requireAuth = passport.authenticate('jwt', { session: false });
mongoose.connect(process.env.DATABASE);

// Initialize passport for use
app.use(passport.initialize());

// Bring in defined Passport Strategy
require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cors());

app.use(function(req, res, next) {
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});
app.use(morgan('dev'));

app.post('/register', function(req, res) {
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
          const token = jwt.sign(user, process.env.HASH_SECRET, {
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

// find user and attemp authentication, ruturn status and token if Authenticated

app.post('/token', function(req, res) {
  console.log(req.body.password, req.body.email);
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          const token = jwt.sign(user, process.env.HASH_SECRET, {
            expiresIn: 10080 // in seconds
          });
          res.status(200).json({ success: true, access_token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

app.get('/points', function (req, res){
  Data_point.find({}, function(err, points){
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true, data: points });
    }
  })
});

app.get('/points/:date', function (req, res){
  // console.log(req.params);
  Data_point.find({date: req.params.date}, function(err, points){
    if (err) {
      console.log('an error occured');
    // } if(!points.data){
    }
    if(points.length == 0){
      // console.log(points);
      res.status(200).json({ success: false, msg: "No data found for "+req.params.date});
    } else {
      console.log(points);
      res.status(200).json({ success: true, data: points });
    }
  })
});

app.delete('/points/:date', requireAuth, function (req, res){
  Data_point.remove({date: req.params.date}, function(err, points){
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true});
    }
  });
});

var dht_sensor = {
  initialize: function () {
    return sensorLib.initialize(11, 6);
  },
  read: function () {
    var readout = sensorLib.read();
    return readout.humidity.toFixed(0);
  }
};

io.on('connection', function(socket){
  var now = new Date();


  if (dht_sensor.initialize()) {
    dht_sensor.read();
  } else {
    console.warn('Failed to initialize sensor');
  }
  var data = {
    timeStamp: dateFormat(now, "h:MM TT"),
    point: {
      temp: ds18b20.temperatureSync('28-00000853833b'),
      humidity: dht_sensor.read()
    }
  };
  io.emit('temperature', data);
});

setInterval(function (){
  var now = new Date();

  if (dht_sensor.initialize()) {
    dht_sensor.read();
  } else {
    console.warn('Failed to initialize sensor');
  }
  var data = {
    timeStamp: dateFormat(now, "h:MM TT"),
    point: {
      temp: ds18b20.temperatureSync('28-00000853833b'),
      humidity: dht_sensor.read()
    }
  };
  io.emit('temperature', data);
  const newPoint = new Data_point({
    _id: shortid.generate(),
    createdAt: unix(new Date()),
    date: dateFormat(now, "mmmm d, yyyy"),
    temp: ds18b20.temperatureSync('28-00000853833b'),
    humidity: dht_sensor.read()
  });

  newPoint.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
}, 180000);

io.listen(process.env.SOCKET_PORT);
app.listen(process.env.SERVER_PORT, function(){
    console.log('running on local host 3000');
});

module.exports = app;
