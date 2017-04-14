var express = require('express');
var path = require('path');
var mongoose = require('mongoose');

var router = express.Router();
var app = express();
var imageschema = mongoose.Schema;

var image = new imageschema({
  _id: {
   type: String,
   required: true
  },
  name: {
   type: String,
   required: true
  },
  url: {
   type: String,
   required: true,
   lowercase: true
  },
  sku: {
   type: String,
   required: true,
   lowercase: true
  },
  category: {
   type: String,
   required: true,
   lowercase: true
  }
},
{
  timestamps: true // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
});

var imagemodel = mongoose.model('image', image);

module.exports = imagemodel;
