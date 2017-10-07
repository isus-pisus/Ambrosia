var express = require('express');
var path = require('path');
var mongoose = require('mongoose');

var router = express.Router();
var app = express();
var DataPointschema = mongoose.Schema;

var DataPoint = new DataPointschema({
  _id: {
    type: String,
    required: true,
  },
  timeStamp: {
    type: Date,
    required: true,
    unique: false
  },
  point: {
    temp: {
      type: String,
      required: true,
    },
    humidity: {
      type: String,
      required: true,
    }
  },
},
{
  timestamps: true // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
});

var DataPointmodel = mongoose.model('DataPoint', DataPoint);

module.exports = DataPointmodel;
