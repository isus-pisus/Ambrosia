var express = require('express');
var path = require('path');
var mongoose = require('mongoose');

var router = express.Router();
var app = express();
var postschema = mongoose.Schema;

var post = new postschema({
  _id: {
    type: String,
    required: true
  },
  title : {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  avatar: {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  createdAt: {
    // type: Date
    type: String,
    required: true
  }
});

var postmodel = mongoose.model('post', post);

module.exports = postmodel;
