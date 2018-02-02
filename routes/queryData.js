const Data_point = require('../models/data');
const routes = require('express').Router();


routes.get('/points', (req, res) => {
  Data_point.find((err, points) => {
    if (err) {
      console.log('an error occured');
    }
    if(points.length == 0){
      res.status(200).json({ success: false, msg: "No data found for "+req.params.date});
    } else {
      res.status(200).json({ success: true, data: points });
    }
  })
})

routes.get('/points/:date', (req, res) => {
  Data_point.find({date: req.params.date}, (err, points) => {
    if (err) {
      console.log('an error occured');
    }
    if(points.length == 0){
      res.status(200).json({ success: false, msg: "No data found for "+req.params.date});
    } else {
      console.log(points);
      res.status(200).json({ success: true, data: points });
    }
  })
})

routes.get('/points/:date', (req, res) => {
  Data_point.remove({date: req.params.date},false, (err, points) => {
    if (err) {
      console.log('an error occured');
    } else {
        res.status(200).json({ success: true});
        console.log({ success: true});
    }
  });
})

module.exports = routes;
