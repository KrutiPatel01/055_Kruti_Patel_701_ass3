const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

async function validateProduct(b) {
  const errors = {};
  if (!b.name || !String(b.name).trim()) errors.name = 'Name is required.';
  if (b.price === '' || b.price === undefined || Number.isNaN(Number(b.price)) || Number(b.price) < 0) errors.price = 'Price must be a number >= 0.';
  if (b.stock === '' || b.stock === undefined || !Number.isInteger(Number(b.stock)) || Number(b.stock) < 0) errors.stock = 'Stock must be a whole number >= 0.';
  if (!b.category || !mongoose.isValidObjectId(b.category)) errors.category = 'Choose a sub-category.';
  else {
    const c = await Category.findById(b.category);
    if (!c) errors.category = 'Category not found.';
    else if (!c.parent) errors.category = 'Products must be added to a sub-category (level 2).';
  }
  return errors;
}

const clean = (b) => ({
  name: String(b.name).trim(),
  description: String(b.description || '').trim(),
  price: Number(b.price),
  stock: Number(b.stock),
  imageUrl: String(b.imageUrl || '').trim(),
  category: b.category
});

// GET /api/products?category=<id>&q=text   (public)
// category may be a level-1 id (includes all its sub-categories) or a level-2 id
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category && mongoose.isValidObjectId(req.query.category)) {
    const subs = await Category.find({ parent: req.query.category }).select('_id');
    filter.category = { $in: [req.query.category, ...subs.map((s) => s._id)] };
  }
  if (req.query.q) {
    filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  const products = await Product.find(filter).populate({ path: 'category', populate: { path: 'parent', select: 'name' } }).sort({ createdAt: -1 });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found.' });
  const p = await Product.findById(req.params.id).populate({ path: 'category', populate: { path: 'parent', select: 'name' } });
  if (!p) return res.status(404).json({ message: 'Product not found.' });
  res.json(p);
});

// ---------- admin only ----------
router.post('/', auth('admin'), async (req, res) => {
  const errors = await validateProduct(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed.', errors });
  res.status(201).json(await Product.create(clean(req.body)));
});

router.put('/:id', auth('admin'), async (req, res) => {
  const errors = await validateProduct(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed.', errors });
  const p = await Product.findByIdAndUpdate(req.params.id, clean(req.body), { new: true });
  if (!p) return res.status(404).json({ message: 'Product not found.' });
  res.json(p);
});

router.delete('/:id', auth('admin'), async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
