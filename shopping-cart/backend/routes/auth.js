const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const router = express.Router();

const sign = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '6h' });

// ---------- admin ----------
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username: String(username || '').trim() });
  if (!admin || !(await bcrypt.compare(String(password || ''), admin.passwordHash))) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  res.json({ token: sign(admin._id, 'admin'), name: admin.username });
});

// ---------- user ----------
router.post('/user/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};
  if (!name || !String(name).trim()) errors.name = 'Name is required.';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email.';
  if (!password || String(password).length < 6) errors.password = 'Password must be at least 6 characters.';
  if (!errors.email && (await User.exists({ email: email.toLowerCase().trim() }))) errors.email = 'Email is already registered.';
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed.', errors });

  const user = await User.create({
    name: name.trim(),
    email,
    passwordHash: await bcrypt.hash(password, 10)
  });
  res.status(201).json({ token: sign(user._id, 'user'), name: user.name });
});

router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ token: sign(user._id, 'user'), name: user.name });
});

module.exports = router;
