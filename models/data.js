var mongoose = require('mongoose');
var express = require('express');

var router = express.Router();
var app = express();

var DataPointschema = mongoose.Schema;

var DataPoint = new DataPointschema({
  _id: {
    type: DataPointschema.ObjectId,
    auto: true
  },
  temp: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  lightSensor: {
    type: Number,
    required: true
  },
  conductivity: {
    type: Number,
    required: true
  },
  nitrogen: {
    type: Number,
    required: true
  },
  co2: {
    type: Number,
    required: true
  },
  pH: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  }
});
var DataPointmodel = mongoose.model('DataPoint', DataPoint);

module.exports = DataPointmodel;
