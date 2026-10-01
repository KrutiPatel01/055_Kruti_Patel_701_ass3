const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/orders   { address }   (user) - turns the cart into an order and reduces stock
router.post('/', auth('user'), async (req, res) => {
  const address = String(req.body.address || '').trim();
  if (!address) return res.status(400).json({ message: 'Delivery address is required.', errors: { address: 'Delivery address is required.' } });

  const cart = await Cart.findOne({ user: req.auth.id }).populate('items.product');
  const lines = cart ? cart.items.filter((i) => i.product) : [];
  if (lines.length === 0) return res.status(400).json({ message: 'Your cart is empty.' });

  // check stock for every line first
  for (const l of lines) {
    if (l.qty > l.product.stock) {
      return res.status(400).json({ message: `"${l.product.name}": only ${l.product.stock} left in stock.` });
    }
  }

  // reduce stock (conditional update so two buyers can't take the last item)
  const reduced = [];
  for (const l of lines) {
    const r = await Product.updateOne({ _id: l.product._id, stock: { $gte: l.qty } }, { $inc: { stock: -l.qty } });
    if (r.modifiedCount !== 1) {
      for (const d of reduced) await Product.updateOne({ _id: d.product._id }, { $inc: { stock: d.qty } }); // roll back
      return res.status(400).json({ message: `"${l.product.name}" just went out of stock.` });
    }
    reduced.push(l);
  }

  const items = lines.map((l) => ({ product: l.product._id, name: l.product.name, price: l.product.price, qty: l.qty }));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const order = await Order.create({ user: req.auth.id, items, total, address });

  cart.items = [];
  await cart.save();
  res.status(201).json(order);
});

// GET /api/orders/mine   (user)
router.get('/mine', auth('user'), async (req, res) => {
  res.json(await Order.find({ user: req.auth.id }).sort({ createdAt: -1 }));
});

// GET /api/orders   (admin) - all orders
router.get('/', auth('admin'), async (req, res) => {
  res.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
});

// PUT /api/orders/:id/status   { status }   (admin)
router.put('/:id/status', auth('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['Placed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Order not found.' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
});

module.exports = router;
