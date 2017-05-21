
// Log proxy requests

var express = require('express');
var app = express();
var morgan  = require('morgan');
const passport = require('passport');
const config = require('./config/main'); // database informainton
const Post = require('./models/post'); // schema for chart data point
const Comm = require('./models/comment'); // schema for chart data point
const Image = require('./models/image'); // schema for chart data point
const User = require('./models/user'); // schema for user info
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
var http = require('http');
var url = require('url');
var dateFormat = require('dateformat');

const requireAuth = passport.authenticate('jwt', { session: false });
mongoose.connect(config.datagetDatabase);

// Initialize passport for use
app.use(passport.initialize());

// Bring in defined Passport Strategy
require('./config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cors());

app.use(function(req, res, next) {
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});
app.use(morgan('dev'));

app.post('/register', function(req, res) {
  console.log(req.body);
  if(!req.body.login || !req.body.email || !req.body.password) {
    res.status(400).json({ success: false, message: 'Please enter email and password.' });
  } else {
    const newUser = new User({
      email: req.body.email,
      username: req.body.login,
      password: req.body.password
    });

    // Attempt to save the user
    newUser.save(function(err) {
      if (err) {
        return res.status(400).json({ success: false, message: 'That email address already exists.'});
      }
      res.status(201).json({ success: true, message: 'Successfully created new user.' });
    });
  }
});

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
app.post('/login', function(req, res) {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          const token = jwt.sign(user, config.secret, {
            expiresIn: 10080 // in seconds
          });
          // console.log(token);
          res.status(200).json({ success: true, token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

// find user and attemp authentication, ruturn status and token

app.post('/token', function(req, res) {
  console.log(req.body.password, req.body.email);
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          const token = jwt.sign(user, config.secret, {
            expiresIn: 10080 // in seconds
          });
          // console.log(token);
          res.status(200).json({ success: true, access_token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

// find and return all data points
app.get('/posts', function (req, res) {
  Post.find(function (err, post) {
    if (err) {
      console.log('something went wrong');
    }
      // console.log(chart);

      res.send(post);
  });
});

// create new post
app.post('/posts', function (req, res) {
  // var url_parts = url.parse(req.url,true);
  var now = new Date();
  var createdAt = dateFormat(now, "mmmm dS, yyyy");
  var body = req.body;
  var avatar = {
    'name': body.avatar_name,
    'url': body.avatar_url
  };

  const newPost = new Post({
    _id: body._id,
    title: body.title,
    body: body.body,
    avatar: avatar,
    createdAt: createdAt
  });

  newPost.save(function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: 'Post could not be saved, check that all fields are entered.'});
    }
    res.status(201).json({ success: true, message: 'Successfully created new post.' });
  });
  console.log(body);
});

// delete a post
app.delete('/posts/:_id', requireAuth, function (req, res) {
  var body = req.params;
  Post.deleteOne({_id: body._id}, function (err) {
    if (err) {
      return res.json({success: false, message:"An error occured. Delete unsuccessfull."});
      // console.log('something went wrong while deleting post');
    } else {
      res.json({success: true, message:"Delete successfull."});

    }
  });
});


// query comments made on a post using post id

app.get('/comments', function (req, res) {
  var query = req.query.comment_id;
  console.log(query);
  Comm.find({comment_id: query},function (err, comment) {
    if (err) {
      console.log('something went wrong');
    }
      res.send(comment);
  });
});

app.get('/categories', function (req, res) {
  var query = req.query;
  Image.find({category: query.category},function (err, categories) {
    if (err) {
      console.log('something went wrong');
    }
      res.send(categories);
  });
});

app.get('/reads/:_id', function (req, res) {
  Post.findOne({_id: req.params._id},function (err, read) {
    if (err) {
      console.log('something went wrong');
    }
      // console.log(chart);
      res.send(read);
  });
});



// app.get('/comments/:_id', function (req, res) {
//   Comm.find({comment_id: req.params._id},function (err, comment) {
//     if (err) {
//       console.log('something went wrong');
//     }
//       // console.log(comment);
//       res.send(comment);
//   });
// });


app.get('/images', function (req, res) {
  Image.find(function (err, image) {
    if (err) {
      console.log('something went wrong');
    }
      // console.log(chart);
      res.send(image);
  });
});


app.post('/images', function (req, res) {
  var body = req.body;
  console.log(body);
  const newImage = new Image({
    _id: body._id,
    sku: body.sku,
    name: body.name,
    category: body.category,
    url: body.url
  });

  newImage.save(function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: 'Image could not be saved, check that all fields are entered.'});
    }
    res.status(201).json({ success: true, message: 'Successfully added new image.' });
  });
  // console.log(body);
});

app.delete('/images/:_id', function (req, res) {
  var body = req.params;
  Image.deleteOne({_id: body._id}, function (err) {
    if (err) {
      return res.json({success: false, message:"An error occured. Delete unsuccessfull."});
      // console.log('something went wrong while deleting post');
    } else {
      res.json({success: true, message:"Delete successfull."});

    }
    // console.log(chart);
  });
});


app.post('/comments', function (req, res) {
  // var url_parts = url.parse(req.url,true);
  var body = req.body.comment;


  const newComment = new Comm({
    _id: body.ref_id,
    comment_id: body.comment_id,
    body: body.body
  });

  newComment.save(function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: 'Comment could not be saved, check that all fields are entered.'});
    }
    res.status(201).json({ success: true, message: 'Successfully created new Comment.' });
  });
  console.log(body);
});

// server.listen(3001);
//  set port to listen to

app.listen(3000, function(){
    console.log('running on local host 3000');
});

module.exports = app;
