const jwt = require('jsonwebtoken');
const User = require('../models/user');
const routes = require('express').Router();

// email, password and username are passed as paramaters

routes.post('/register', (req, res) => {
  if(!req.body.login || !req.body.email || !req.body.password) {
    res.status(400).json({ success: false, message: 'Please enter email and password.' });
  } else {
    const newUser = new User({
      email: req.body.email,
      username: req.body.login,
      password: req.body.password
    });

    // Attempt to save the user information
    newUser.save( (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'That email address already exists.'});
      }
      res.status(201).json({ success: true, message: 'Successfully created new user.' });
    });
  }
})

/*
email and password are passed as parameters through body to authenticate the user
and return a token
*/

routes.post('/login', (req, res) => {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const token = jwt.sign(user, process.env.HASH_SECRET, {
          });
          res.status(200).json({ success: true, token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  })
})

/*
  email and password are passed as parameters through body to authenticate the user
  and return a token
*/

routes.post('/token', (req, res) => {
  console.log(req.body.password, req.body.email);
  User.findOne({
    email: req.body.email
  }, (err, user) => {
    if (err) throw err;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          const token = jwt.sign(user, process.env.HASH_SECRET, {
            expiresIn: 10080 // in seconds
          });
          res.status(200).json({ success: true, access_token: 'JWT ' + token });
        } else {
          res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  })
});

module.exports = routes;
