var mongoose = require('mongoose');
var express = require('express');

var router = express.Router();
var app = express();
var DataPointschema = mongoose.Schema;

var DataPoint = new DataPointschema({
  device: {
    type: String,
    // required: true
  },
  entry: {
    type: String,
    // required: true
  }
},
{
  timestamps: true
});
var DataPointmodel = mongoose.model('DataPoint', DataPoint);

module.exports = DataPointmodel;
