const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Admin',
  new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true }
  })
);
