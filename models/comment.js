var express = require('express');
var path = require('path');
var mongoose = require('mongoose');

var router = express.Router();
var app = express();
var commentschema = mongoose.Schema;

var comment = new commentschema({
  _id: {
    type: String,
    required: true,
  },
  comment_id: {
    type: String,
    required: true,
    unique: false
  },
  body: {
    type: String,
    required: true,
  },
},
{
  timestamps: true // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
});

var commentmodel = mongoose.model('comment', comment);

module.exports = commentmodel;
