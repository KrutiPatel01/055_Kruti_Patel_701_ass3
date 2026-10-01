// server.js
// Express Login Application with REDIS session store
// Functionalities: Login, 2 protected routes (Dashboard, Profile), Logout

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- View engine & body parsing ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- "Database" of users (demo only) ----------
// Passwords are stored hashed (bcrypt), never in plain text.
const users = [
  { id: 1, username: 'alice', passwordHash: bcrypt.hashSync('alice123', 10) },
  { id: 2, username: 'bob', passwordHash: bcrypt.hashSync('bob123', 10) }
];

function findUser(username) {
  return users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
}

// ---------- Redis connection ----------
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.error('Redis Error:', err.message));

// ---------- Auth middleware ----------
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
}

async function startServer() {
  await redisClient.connect();
  console.log('Redis connected');

  // ---------- Session configuration: REDIS STORE ----------
  // Each session is saved in Redis as a key "sess:<sessionId>" with a TTL,
  // instead of the default in-memory store.
  app.use(
    session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'sess:',
        ttl: 60 * 60 // seconds; key expires after 1 hour
      }),
      secret: process.env.SESSION_SECRET || 'replace-this-with-a-long-random-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 hour, matches store ttl above
        // secure: true, // enable this once the app is served over HTTPS
      }
    })
  );

  // Convenience: expose logged-in user (or null) to every view
  app.use((req, res, next) => {
    res.locals.currentUser = (req.session && req.session.user) || null;
    next();
  });

  // ---------- Routes ----------

  app.get('/', (req, res) => {
    res.redirect(req.session.user ? '/dashboard' : '/login');
  });

  // GET login form
  app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', {
      error: null,
      username: '',
      redirectTo: req.query.redirect || '/dashboard'
    });
  });

  // POST login
  app.post('/login', (req, res) => {
    const { username, password, redirectTo } = req.body;
    const user = username ? findUser(username) : null;
    const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';

    const passwordOk = user && bcrypt.compareSync(password || '', user.passwordHash);

    if (!user || !passwordOk) {
      return res.status(401).render('login', {
        error: 'Invalid username or password.',
        username: username || '',
        redirectTo: target
      });
    }

    // Regenerate the session on login to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('login', {
          error: 'Something went wrong logging you in. Please try again.',
          username: username || '',
          redirectTo: target
        });
      }
      req.session.user = { id: user.id, username: user.username };
      res.redirect(target);
    });
  });

  // ---------- Protected route 1: Dashboard ----------
  app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
      user: req.session.user,
      sessionId: req.sessionID
    });
  });

  // ---------- Protected route 2: Profile ----------
  app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', {
      user: req.session.user,
      sessionId: req.sessionID,
      loginTime: req.session.cookie.expires
    });
  });

  // ---------- Logout ----------
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Error destroying session:', err);
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });

  // ---------- 404 ----------
  app.use((req, res) => {
    res.status(404).send('Page not found. <a href="/">Go home</a>');
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Demo users -> alice/alice123, bob/bob123');
  });
}

startServer().catch((err) => {
  console.error('Could not start server (is Redis running?):', err.message);
  process.exit(1);
});
