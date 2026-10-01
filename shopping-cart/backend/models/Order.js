const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // price and name are copied at purchase time so later product edits don't change old orders
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number
      }
    ],
    total: { type: Number, required: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Placed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Placed' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
