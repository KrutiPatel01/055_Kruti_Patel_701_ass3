// Small helper collection used to generate sequential employee ids (EMP001, EMP002, ...)
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
