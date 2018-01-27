require('./config/dev');
var morgan  = require('morgan');
var express = require('express');
const passport = require('passport');
const Data_point = require('./models/data'); // schema for chart data point
const User = require('./models/user'); // schema for user info
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var GPIO = require('onoff').Gpio;
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
  Data_point.remove({date: req.params.date},false, function(err, points){
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true});
        console.log({ success: true});
    }
  });
});

//adding pump functionality

var readout = sensorLib.read(11, 6);
var led = new GPIO(17, 'out');

io.on('connection', function(socket){
  var now = new Date();
  var emit_data = {
    time: dateFormat(now, "h:MM TT"),
    date: dateFormat(now, "mmmm d, yyyy"),
    point: {
      temp: ds18b20.temperatureSync('28-00000853833b'),
      humidity: readout.humidity.toFixed(0)
    }
  };

  io.emit('justConnected', emit_data);
  socket.on('pump', function(params){
    if (params.state == true){
      led.writeSync(1);
    }else{
      led.writeSync(0);
    }
  });
});


setInterval( function (){
  var now = new Date();

  var data = {
    timeStamp: dateFormat(now, "h:MM TT"),
    point: {
      temp: ds18b20.temperatureSync('28-00000853833b'),
      humidity: readout.humidity.toFixed(0)
    }
  };
  var emit_data = {
    time: dateFormat(now, "h:MM TT"),
    date: dateFormat(now, "mmmm d, yyyy"),
    point: {
      temp: ds18b20.temperatureSync('28-00000853833b'),
      humidity: readout.humidity.toFixed(0)
    }
  };
  io.emit('temperature', emit_data);
  const newPoint = new Data_point({
    _id: shortid.generate(),
    createdAt: unix(new Date()),
    date: dateFormat(now, "mmmm d, yyyy"),
    temp: ds18b20.temperatureSync('28-00000853833b'),
    humidity: readout.humidity.toFixed(0)
  });

  newPoint.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
      console.log("emit");
}, 10*60*1000);

/**
	collecting and sending data from pH, Nitrogen, co2, Turbidity and light sensor every two minute
 **/

setInterval( function() {
  var variousSensorData  = {
  	lightSensor: 0,
  	preTurbidity: 0,
  	postTurbidity: 0,
  	nitrogen: 0,
  	co2: 0,
  	pH: 0
  };
  io.emit('liveStreamData', variousSensorData);

}, 1*60*1000);


io.listen(process.env.SOCKET_PORT);
app.listen(process.env.SERVER_PORT, function(){
    console.log('running on local host 3000');
});

module.exports = app;
