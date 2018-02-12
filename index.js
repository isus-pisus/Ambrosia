require('./config/dev');
require('./config/passport')(passport);
import { startSequence, automateDevice, startInXTime } from './libs/control.lib';
import { getTemperature, getHumidity } from './libs/readSensor.lib';
const authenticationRoutes  = require('./routes/authentication');
const queryDataRoutes  = require('./routes/queryData');
const Data_point = require('./models/data');
const morgan  = require('morgan');
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const url = require('url');
const dateFormat = require('dateformat');
const unix = require('unix-time');
const io = require('socket.io')();
var app = express();
const requireAuth = passport.authenticate('jwt', { session: false });

//middleware setup

mongoose.connect(process.env.DATABASE);
app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(morgan('dev'));
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  next();
});

//  All routes

app.use('/register', authenticationRoutes);
app.use('/login', authenticationRoutes);
app.use('/token', authenticationRoutes);
app.get('/points', queryDataRoutes);
app.get('/points/:date', queryDataRoutes);
app.delete('/points/:date', queryDataRoutes)

/*
  initiate socket connection and send latest data on the time of connectiing. Listeners
  'automate' and 'startInXTime' are set to call automateDevice() and startInXTime().

  automateDevice(device, state, onTime, offTime)
  device => String (device name to comtrol, check config/pins.js for a list of devices that can be controlled)
  state => Boolean (true/false, true turns the device on while false turns device off)
  onTime => Seconds (amount of time to device should stay on)
  offTime => Seconds (amount of time device id to be turned off for)

  startInXTime(device, state, onTime, offTime, startOn)
  device => String (device name to comtrol, check config/pins.js for a list of devices that can be controlled)
  state => Boolean (true/false, true turns the device on while false turns device off)
  onTime => Seconds (amount of time to device should stay on)
  offTime => Seconds (amount of time device id to be turned off for)
  startOn => Seconds (amount of time for device to sleep after command is called)
*/

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
    automateDevice(params.device, params.state, params.onTime, params.offTime);
  });
  socket.on('startInXTime', (params) => {
    startInXTime(params.device, params.state, params.onTime, params.offTime, params.startOn);
  });
});

/*
  setInterval called every 10 minutes which allows for data to be sent to front-end. Data
  is also saved same time to MongoDB.
*/

setInterval(()=> {
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
    conductivity: 0,
    nitrogen: 0,
    co2: 0,
    pH: 0,
    createdAt: unix(dateFormat(now, "mmmm d, yyyy"))
  });
  newPoint.save((err) => {
    if (err) {
      console.log(err);
    }
  });
}, 10*60*1000);

//  setInterval function to send data to front-end every 1 minute

setInterval(() => {
  let emit_data  = {
  	lightSensor: 0,
  	conductivity: 0,
  	nitrogen: 0,
  	co2: 0,
  	pH: 0
  };
  io.emit('liveStreamData', emit_data);
  // TODO: add sonctionality to save sensor data to database

}, 1*60*1000);

//  here devices are automated by passing in parameters; automateDevice will run indefinately

startSequence();
automateDevice('idleLed', true, 200, 3*1000);
automateDevice('pump', true, 30*1000, 20*60*1000);
automateDevice('led', true, 64800*1000, 21600*1000);

//  socket port and node server port initiated

io.listen(process.env.SOCKET_PORT);
app.listen(process.env.SERVER_PORT, () => {
    console.log('running on local host 3000');
});

module.exports = app;
