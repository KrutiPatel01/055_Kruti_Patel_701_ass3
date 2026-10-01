const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/categories -> tree: [{_id, name, children:[{_id, name}]}]   (public)
router.get('/', async (req, res) => {
  const all = await Category.find().sort({ name: 1 }).lean();
  const tree = all
    .filter((c) => !c.parent)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      children: all.filter((c) => String(c.parent) === String(p._id)).map((c) => ({ _id: c._id, name: c.name }))
    }));
  res.json(tree);
});

// POST /api/categories   { name, parent? }   (admin)  parent must be a level-1 category
router.post('/', auth('admin'), async (req, res) => {
  const name = String(req.body.name || '').trim();
  const parent = req.body.parent || null;
  if (!name) return res.status(400).json({ message: 'Category name is required.' });

  if (parent) {
    if (!mongoose.isValidObjectId(parent)) return res.status(400).json({ message: 'Invalid parent.' });
    const p = await Category.findById(parent);
    if (!p) return res.status(400).json({ message: 'Parent category not found.' });
    if (p.parent) return res.status(400).json({ message: 'Only 2 levels are allowed: a sub-category cannot have children.' });
  }

  try {
    const cat = await Category.create({ name, parent });
    res.status(201).json(cat);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This category already exists here.' });
    throw err;
  }
});

// PUT /api/categories/:id   { name }   (admin) - rename only
router.put('/:id', auth('admin'), async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Category name is required.' });
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'This category already exists here.' });
    throw err;
  }
});

// DELETE /api/categories/:id   (admin) - blocked if it still has sub-categories or products
router.delete('/:id', auth('admin'), async (req, res) => {
  const id = req.params.id;
  if (await Category.exists({ parent: id })) return res.status(400).json({ message: 'Delete its sub-categories first.' });
  if (await Product.exists({ category: id })) return res.status(400).json({ message: 'Category still has products.' });
  const cat = await Category.findByIdAndDelete(id);
  if (!cat) return res.status(404).json({ message: 'Category not found.' });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
