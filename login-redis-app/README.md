# Express Login App — Redis Session Store

A fullstack Express app with login, two protected routes, and logout, using
Redis (via `connect-redis` + `redis`) to store sessions instead of the
default in-memory store.

## Folder structure

```
login-redis-app/
├── server.js            # routes, redis + session config, auth middleware
├── package.json
├── views/
│   ├── login.ejs
│   ├── dashboard.ejs     # protected route 1
│   └── profile.ejs       # protected route 2
└── public/
    └── style.css
```

## Prerequisites

You need a Redis server reachable at the URL the app connects to.

**Install & run Redis locally (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo service redis-server start   # or: redis-server (foreground)
redis-cli ping                    # should print PONG
```
**macOS (Homebrew):** `brew install redis && brew services start redis`

**Or run it in Docker instead of installing it:**
```bash
docker run -d --name redis -p 6379:6379 redis:7
```

By default the app connects to `redis://localhost:6379`. To point it
somewhere else (a remote Redis, a different port, a password-protected
instance), set the `REDIS_URL` environment variable, e.g.:
```bash
REDIS_URL=redis://:mypassword@my-redis-host:6379 npm start
```

## Setup

```bash
npm install
npm start
```

Open **http://localhost:5000** (port comes from `.env`; default is 5000).

**Demo accounts:** `alice / alice123` or `bob / bob123` (defined in
`server.js`, passwords stored bcrypt-hashed even for this demo).

## What it does

- **`GET /login`, `POST /login`** — login form + credential check
  (`bcrypt.compareSync`). On failure, the form re-renders with an error and
  the username kept (password left blank). On success,
  `req.session.regenerate()` runs before `req.session.user` is set — this
  guards against session fixation (an attacker handing a victim a
  pre-set session ID before they log in).
- **`GET /dashboard`** — protected route 1.
- **`GET /profile`** — protected route 2.
- **`POST /logout`** — destroys the session, which deletes its key from
  Redis, and clears the cookie.
- **`requireAuth` middleware** — checks `req.session.user`; if missing,
  redirects to `/login?redirect=<originalUrl>` so the user returns to
  where they were headed after logging in.

## Why Redis for sessions

The default `express-session` memory store loses all sessions on restart
and can't be shared across multiple server processes. Redis solves both:
sessions persist independently of the Node process, and any number of app
instances (e.g. behind a load balancer) can share the same session store —
which is why Redis (rather than a file store) is the standard choice for
apps that need to scale horizontally.

Each session is stored as a Redis key named `sess:<sessionId>` with a TTL
matching the cookie's `maxAge` (1 hour here), so Redis expires stale
sessions on its own. You can watch this happen from the CLI:
```bash
redis-cli KEYS "sess:*"
redis-cli GET "sess:<the-id-you-see>"
```

## Notes for production (worth mentioning if asked)

- Replace the hardcoded `secret` in `server.js` with a long random value
  from an environment variable.
- Set `cookie.secure: true` once served over HTTPS.
- Point `REDIS_URL` at a managed/production Redis instance, ideally with
  a password and TLS.
- Replace the in-code `users` array with a real database.
