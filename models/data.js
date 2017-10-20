const timeZone = require('mongoose-timezone');
var mongoose = require('mongoose');
var express = require('express');
var path = require('path');

var router = express.Router();
var app = express();
var DataPointschema = mongoose.Schema;

var DataPoint = new DataPointschema({
  _id: {
      type: String,
      required: true
  },
  date: {
    type: String,
    required: true
  },
  temp: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date
  }
});
DataPoint.plugin(timeZone, { paths: ['timestamp'] });
var DataPointmodel = mongoose.model('DataPoint', DataPoint);

module.exports = DataPointmodel;
