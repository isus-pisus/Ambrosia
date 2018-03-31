const Data_point = require('../models/data');
const routes = require('express').Router();
var _ = require('lodash');


// get all data point saved in database

routes.get('/points', (req, res) => {

  if (req.query.end === undefined && req.query.start === undefined) {
    Data_point.find((err, points) => {
      if (err) {
        console.log('an error occured');
      }
      if(points.length == 0){
        res.status(200).json({ success: false, msg: "No data found"});
      } else {
        res.status(200).json({ success: true, data: points });
      }
    })
  }

  if (_.isString(req.query.start) && req.query.end === undefined ) {
    Data_point.find({createdAt: {"$gte": req.query.start}}, (err, points) => {
      if (err) {
        console.log('an error occured');
      }
      if(points.length == 0){
        res.status(200).json({ success: false, msg: "No data found for "+req.query.start});
      } else {
        res.status(200).json({ success: true, data: points });
      }
    })
  }

  if (_.isString(req.query.end) && req.query.start === undefined) {
    Data_point.find({createdAt: {"$lte": req.query.end}}, (err, points) => {
      if (err) {
        console.log('an error occured');
      }
      if(points.length == 0){
        res.status(200).json({ success: false, msg: "No data found for "+req.query.end});
      } else {
        res.status(200).json({ success: true, data: points});
      }
    })
  }

  if (_.isString(req.query.start) && _.isString(req.query.end)) {
    Data_point.find({createdAt: {"$gte": req.query.start, "$lte": req.query.end}}, (err, points) => {
      if (err) {
        console.log('an error occured');
      }
      if(points.length == 0){
        res.status(200).json({ success: false, msg: "No data found for "+req.query.start+" and "+req.query.end});
      } else {
        res.status(200).json({ success: true, data: points });
      }
    })
  }

})

/*
  readings for a specific date can be found by passing the date dynamically in unix timestamp
  format, NB date is currently being passed in the format 'mmmm dd, yyyy'
*/

routes.get('/points/:date', (req, res) => {
  Data_point.find({createdAt: req.params.date}, (err, points) => {
    if (err) {
      console.log('an error occured');
    }
    if(points.length == 0){
      res.status(200).json({ success: false, msg: "No data found for "+ req.params.date});
    } else {
      console.log(points);
      res.status(200).json({ success: true, data: points });
    }
  })
})

/*
  readings for a specific date can be found and deleted by passing the date dynamically in unix timestamp
  format, NB date is currently being passed in the format 'mmmm dd, yyyy'
*/

routes.get('/points/:date', (req, res) => {
  Data_point.remove({createdAt: req.params.date},false, (err, points) => {
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true});
        console.log({ success: true});
    }
  });
})

module.exports = routes;
