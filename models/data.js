var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var shortid = require('shortid');

var router = express.Router();
var app = express();
var DataPointschema = mongoose.Schema;

var DataPoint = new DataPointschema({
  _id: {
      type: String,
      'default': shortid.generate
  },
  // timeStamp: {
  //   type: String,
  //   required: true,
  // },
  temp: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  }
},
{
  timestamps: true // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
});

var DataPointmodel = mongoose.model('DataPoint', DataPoint);

module.exports = DataPointmodel;
