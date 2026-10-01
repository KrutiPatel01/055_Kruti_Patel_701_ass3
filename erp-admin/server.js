// server.js
// ERP Admin Panel - session login + employee CRUD + salary calculation
// Express + Mongoose + EJS (+ express-session with MongoDB store)

require('dotenv').config();
require('express-async-errors'); // lets Express 4 catch errors thrown inside async route handlers

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const Admin = require('./models/Admin');
const requireAdmin = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp';

// ---------- View engine & body parsing ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Session (stored in MongoDB so it survives restarts) ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions', ttl: 60 * 60 }),
    cookie: { httpOnly: true, maxAge: 60 * 60 * 1000 }
  })
);

// ---------- Flash messages + current admin available in every view ----------
app.use((req, res, next) => {
  res.locals.admin = (req.session && req.session.admin) || null;
  res.locals.flash = req.session ? req.session.flash : null;
  if (req.session) delete req.session.flash;
  next();
});

// ---------- Routes ----------
app.get('/', (req, res) => res.redirect(req.session.admin ? '/employees' : '/login'));

app.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/employees');
  res.render('login', { error: null, username: '' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = username ? await Admin.findOne({ username: username.trim() }) : null;
  const ok = admin && (await bcrypt.compare(password || '', admin.passwordHash));

  if (!ok) {
    return res.status(401).render('login', { error: 'Invalid username or password.', username: username || '' });
  }

  // regenerate session id on login (prevents session fixation)
  req.session.regenerate((err) => {
    if (err) return res.status(500).send('Login failed, try again.');
    req.session.admin = { id: admin._id.toString(), username: admin.username };
    res.redirect('/employees');
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// everything below needs an admin session
app.use('/employees', requireAdmin, require('./routes/employees'));

// ---------- 404 & error handler ----------
app.use((req, res) => res.status(404).send('Page not found. <a href="/">Go home</a>'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong: ' + err.message);
});

// ---------- Start: connect DB, create default admin if none, listen ----------
async function start() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  if ((await Admin.countDocuments()) === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await Admin.create({ username, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`Default admin created -> ${username} / ${password}`);
  }

  app.listen(PORT, () => console.log(`ERP admin running at http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Could not start server (is MongoDB running?):', err.message);
  process.exit(1);
});
