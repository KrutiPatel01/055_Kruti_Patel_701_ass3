const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth('user'));

// returns the cart with product details + totals
async function cartResponse(userId) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const items = (cart ? cart.items : [])
    .filter((i) => i.product) // product may have been deleted by admin
    .map((i) => ({ product: i.product, qty: i.qty, lineTotal: i.product.price * i.qty }));
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, total, count: items.reduce((n, i) => n + i.qty, 0) };
}

router.get('/', async (req, res) => {
  res.json(await cartResponse(req.auth.id));
});

// POST /api/cart   { productId, qty }  -> adds qty (default 1) to the cart
router.post('/', async (req, res) => {
  const { productId } = req.body;
  const qty = Number(req.body.qty || 1);
  if (!mongoose.isValidObjectId(productId) || !Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ message: 'Invalid product or quantity.' });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  let cart = await Cart.findOne({ user: req.auth.id });
  if (!cart) cart = new Cart({ user: req.auth.id, items: [] });

  const existing = cart.items.find((i) => String(i.product) === String(productId));
  const newQty = (existing ? existing.qty : 0) + qty;
  if (newQty > product.stock) return res.status(400).json({ message: `Only ${product.stock} in stock.` });

  if (existing) existing.qty = newQty;
  else cart.items.push({ product: productId, qty });
  await cart.save();
  res.json(await cartResponse(req.auth.id));
});

// PUT /api/cart/:productId   { qty }  -> set quantity
router.put('/:productId', async (req, res) => {
  const qty = Number(req.body.qty);
  if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ message: 'Quantity must be 1 or more.' });
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  if (qty > product.stock) return res.status(400).json({ message: `Only ${product.stock} in stock.` });

  const cart = await Cart.findOne({ user: req.auth.id });
  const item = cart && cart.items.find((i) => String(i.product) === req.params.productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart.' });
  item.qty = qty;
  await cart.save();
  res.json(await cartResponse(req.auth.id));
});

router.delete('/:productId', async (req, res) => {
  await Cart.updateOne({ user: req.auth.id }, { $pull: { items: { product: req.params.productId } } });
  res.json(await cartResponse(req.auth.id));
});

module.exports = router;
