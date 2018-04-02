const Data_point = require('../models/data');
const routes = require('express').Router();
var _ = require('lodash');

// get all data point saved in database
function handleResponse(res, err, points, next) {
  try {
    if (err) {
      res.status(400).json({msg: "No data found for date entered. The problem might be that the query string is not a valid unix timestamp or the data simply doesn't exist"});
    }
    if(points.length == 0){
      res.status(200).json({msg: "No data found for date entered. The problem might be that the query string is not a valid unix timestamp or the data simply doesn't exist"});
    }
    if(_.isUndefined(points.length)){
      res.status(400).json({msg: "No data found for date entered. The problem might be that the query string is not a valid unix timestamp or the data simply doesn't exist"});
    } else {
      res.status(200).json({ success: true, data: points});
    }
  } catch (e) {
    next();
    ;
  }
}

routes.get('/points', handleResponse, (req, res, next) => {
  if ( _.isUndefined(req.query.start) && _.isUndefined(req.query.end)) {
    Data_point.find((err, points) => {
      handleResponse(res, err, points, next);
    })
  }

  if (_.isString(req.query.start) && _.isUndefined(req.query.end)) {
    Data_point.find({createdAt: {"$gte": req.query.start}}, (err, points) => {
      handleResponse(res, err, points, next);
    })
  }

  if ( _.isUndefined(req.query.start) && _.isString(req.query.end)) {
    Data_point.find({createdAt: {"$lte": req.query.end}}, (err, points) => {
      handleResponse(res, err, points, next);
    })
  }

  if (_.isString(req.query.start) && _.isString(req.query.end)) {
    Data_point.find({createdAt: {"$gte": req.query.start, "$lte": req.query.end}}, (err, points) => {
      handleResponse(res, err, points, next);
    });
  }
})

/*
  readings for a specific date can be found by passing the date dynamically in unix timestamp
  format, NB date is currently being passed in the format 'mmmm dd, yyyy'
*/

routes.get('/points/:date', handleResponse , (req, res, next) => {
  Data_point.find({createdAt: req.params.date}, (err, points) => {
    handleResponse(res, err, points, next);
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
