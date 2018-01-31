require('./config/dev');
import { automateDevice } from './libs/control.lib.js';
import { getTemperature, getHumidity } from './libs/readSensor.lib.js';

const morgan  = require('morgan');
const express = require('express');
const passport = require('passport');
const Data_point = require('./models/data');
const User = require('./models/user');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const url = require('url');
const dateFormat = require('dateformat');
const unix = require('to-unix-timestamp');
var app = express();

 // sensors


const io = require('socket.io')();

const requireAuth = passport.authenticate('jwt', { session: false });
mongoose.connect(process.env.DATABASE);

app.use(passport.initialize());

require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cors());

app.use( (req, res, next) => {
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});
app.use(morgan('dev'));

app.post('/register', (req, res) => {
  if(!req.body.login || !req.body.email || !req.body.password) {
    res.status(400).json({ success: false, message: 'Please enter email and password.' });
  } else {
    const newUser = new User({
      email: req.body.email,
      username: req.body.login,
      password: req.body.password
    });

    // Attempt to save the user
    newUser.save( (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'That email address already exists.'});
      }
      res.status(201).json({ success: true, message: 'Successfully created new user.' });
    });
  }
});

app.post('/login', (req, res) => {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const token = jwt.sign(user, process.env.HASH_SECRET, {
          });
          res.status(200).json({ success: true, token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

// find user and attemp authentication, ruturn status and token if Authenticated

app.post('/token', (req, res) => {
  console.log(req.body.password, req.body.email);
  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
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

app.get('/points', (req, res) => {
  Data_point.find({}, (err, points) => {
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true, data: points });
    }
  })
});

app.get('/points/:date', (req, res) => {
  Data_point.find({date: req.params.date}, (err, points) => {
    if (err) {
      console.log('an error occured');
    }
    if(points.length == 0){
      res.status(200).json({ success: false, msg: "No data found for "+req.params.date});
    } else {
      console.log(points);
      res.status(200).json({ success: true, data: points });
    }
  })
});

app.delete('/points/:date', requireAuth, (req, res) => {
  Data_point.remove({date: req.params.date},false, (err, points) => {
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true});
        console.log({ success: true});
    }
  });
});

io.on('connection', (socket) => {
  let now = new Date();
  let emit_data = {
    time: dateFormat(now, "h:MM TT"),
    date: dateFormat(now, "mmmm d, yyyy"),
    point: {
      temp: getTemperature(),
      humidity: getHumidity()
    }
  };

  io.emit('justConnected', emit_data);
  socket.on('automate', (params) => {
    automateDevice(params.device, params.state, params.duration);
  });
});

setInterval( ()=> {
  let now = new Date();
  let emit_data = {
    time: dateFormat(now, "h:MM TT"),
    date: dateFormat(now, "mmmm d, yyyy"),
    point: {
      temp: getTemperature(),
      humidity: getHumidity()
    }
  };

  io.emit('temperature', emit_data);

  const newPoint = new Data_point({
    temp: getTemperature(),
    humidity: getHumidity(),
    lightSensor: 0,
    turbidity: 0,
    nitrogen: 0,
    co2: 0,
    pH: 0
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

setInterval( () => {
  let emit_data  = {
  	lightSensor: 0,
  	turbidity: 0,
  	nitrogen: 0,
  	co2: 0,
  	pH: 0
  };
  io.emit('liveStreamData', emit_data);

  // TODO: add sonctionality to save sensor data to database

}, 1*60*1000);

io.listen(process.env.SOCKET_PORT);
app.listen(process.env.SERVER_PORT, () => {
    console.log('running on local host 3000');
});

module.exports = app;
