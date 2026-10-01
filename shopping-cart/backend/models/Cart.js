const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Cart',
  new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        qty: { type: Number, required: true, min: 1 }
      }
    ]
  })
);
