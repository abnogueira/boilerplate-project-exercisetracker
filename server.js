use strict'

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Users = require('./models/users.js');
var Exercise = require('./models/exercise.js');

mongoose.connect(process.env.MONGODB, (err, db) => {
  if (err) console.log(`Error`, err);
  console.log(`Connected to MongoDB`);
});

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


/* US1: I can create a user by posting form data username to 
/api/exercise/new-user and returned will be an object with username and _id.
*/
app.post('/api/exercise/new-user', (req, res) => {
  const username = req.body.username;
  if (username === '') {
    res.send('Username cannot be blank');
  } else {
    var newUser = new Users({
      username
    });
    newUser.save((err, data) => {
      if (err){
        if (err.name === 'MongoError' && err.code === 11000) { // duplicate key error
          res.send('Duplicate username, try a different username');
        } else {
          res.send('Error occurred while saving user');
        }
      } else {
        res.json(data);
      }
    });
  }
});

/* US2: I can get an array of all users by getting 
api/exercise/users with the same info as when creating a user.
*/
app.get('/api/exercise/users', (req, res, next) => {
  Users.find({}).exec((err,results)=> {
    if(err){
      res.status(500).send('Could not list users');
    }else{
      res.json(results);
    }});
});

/* US3: I can add an exercise to any user by posting form data 
userId(_id), description, duration, and optionally date to 
/api/exercise/add. If no date supplied it will use current date.
Returned will the the user object also with the exercise fields added.
*/
app.post('/api/exercise/add', (req, res, next) => {
  if (req.body.userId === '') {
    res.send('UserId cannot be blank');
  } else if (!req.body.description){
    res.send('Description cannot be blank');
  } else if (!req.body.duration){
    res.send('Duration cannot be blank');
  } else {
    let dateExerc = req.body.date;
    if (!req.body.date) {
      dateExerc = new Date();
    }
    var newExerc = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: dateExerc
    });
    newExerc.save((err, data) => {
      if (err){
        if (err.name === 'MongoError') { // duplicate key error
          res.send('Mongo error');
        } else {
          res.send('Error occurred while saving exercise');
        }
      } else {
        res.json(data);
      }
    });
  }
});


/* US4: I can retrieve a full exercise log of any user by 
getting /api/exercise/log with a parameter of userId(_id).
Return will be the user object with added array log and 
count (total exercise count).
 US5: I can retrieve part of the log of any user by also 
passing along optional parameters of from & to or limit. 
(Date format yyyy-mm-dd, limit = int)
*/
app.get('/api/exercise/log', (req, res, next) => {
  if(req.query.userId){
    Users.findById(req.query.userId, function(err, user) {
      if(err){
        res.sendStatus(500);
        console.log(err);
        return;
      };
      
      if(user){
        const MAX_TIMESTAMP = 8640000000000000;
        let fromDate=new Date(-MAX_TIMESTAMP);
        let toDate=new Date(MAX_TIMESTAMP);
        let limit=0;
        if(req.query.from) fromDate=new Date(req.query.from.split('-')[0], 
                                               req.query.from.split('-')[1]-1, 
                                               req.query.from.split('-')[2]);
        if(req.query.to) toDate=new Date(req.query.to.split('-')[0], 
                                           req.query.to.split('-')[1]-1, 
                                           req.query.to.split('-')[2]);
        if(req.query.limit) limit=Number(req.query.limit);

        Exercise.find({
            userId: req.query.userId, 
            date: { $gte: fromDate, $lte: toDate }
          }).limit(limit)
            .exec(function (err, logs) {
            let logArr=[];
            let count=0;
            logs.forEach(function(elem) {
              logArr.push({ 
                "description": elem.description,
                "duration": elem.duration,
                "date":elem.date.toDateString() });
              count++;
            });

            res.json({
              _id: user._id,
              username: user.username,
              log: logArr,
              count: count
            });
          });
      }else{
        res.send('UserId not found, try a different userId.');
      };
    });
  } else {
    res.send('userId is missing.');
  };
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
