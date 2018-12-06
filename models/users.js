'use strict'

const shortid = require('shortid');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var Users = new Schema({
  username: {
    type: String, 
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Users', Users);