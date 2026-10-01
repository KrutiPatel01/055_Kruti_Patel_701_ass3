// Shopping cart API - Express + Mongoose + JWT (admin and user roles)
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopping_cart';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env');
  process.exit(1);
}

// admin site runs on 5173, user site on 5174
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error: ' + err.message });
});

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  if ((await Admin.countDocuments()) === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await Admin.create({ username, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`Default admin created -> ${username} / ${password}`);
  }

  app.listen(PORT, () => console.log(`Shopping cart API running at http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Could not start (is MongoDB running?):', err.message);
  process.exit(1);
});
