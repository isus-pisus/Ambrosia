require('./config/dev');
import { startSequence, automateDevice } from './libs/control.lib';
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

app.use('/register', authenticationRoutes);
app.use('/login', authenticationRoutes);
app.use('/token', authenticationRoutes);
app.get('/points', queryDataRoutes);
app.get('/points/:date', queryDataRoutes);
app.delete('/points/:date', queryDataRoutes);
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
    conductivity: 0,
    nitrogen: 0,
    co2: 0,
    pH: 0,
    createdAt: unix(dateFormat(now, "mmmm d, yyyy"))
  });

  newPoint.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
}, 10*60*1000);

setInterval( () => {
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

startSequence();
automateDevice('idleLed', true, 30*1000, 20*60*1000);
automateDevice('led', true, 64800*1000, 21600*1000);

io.listen(process.env.SOCKET_PORT);
app.listen(process.env.SERVER_PORT, () => {
    console.log('running on local host 3000');
});

module.exports = app;
