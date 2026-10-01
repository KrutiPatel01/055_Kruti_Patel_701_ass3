# Express Login App — File Session Store

A fullstack Express app with login, two protected routes, and logout, using
`session-file-store` so sessions are persisted as files on disk instead of
in memory (survives server restarts, works across multiple processes).

## Folder structure

```
login-app/
├── server.js            # routes, session config, auth middleware
├── package.json
├── views/
│   ├── login.ejs
│   ├── dashboard.ejs     # protected route 1
│   └── profile.ejs       # protected route 2
├── public/
│   └── style.css
└── sessions/             # session files are written here at runtime
```

## Setup

```bash
npm install
npm start
```

Open **http://localhost:3000**.

**Demo accounts:** `alice / alice123` or `bob / bob123` (defined in `server.js`,
passwords stored bcrypt-hashed even for this demo).

## What it does

- **`GET /login`, `POST /login`** — login form + credential check
  (`bcrypt.compareSync` against a hashed password). On failure, the form
  re-renders with an error and the username kept (password left blank).
  On success, `req.session.regenerate()` is called before setting
  `req.session.user` — this prevents session fixation attacks (an attacker
  handing a victim a pre-set session ID).
- **`GET /dashboard`** — protected route 1.
- **`GET /profile`** — protected route 2.
- **`POST /logout`** — destroys the session (deletes its file from
  `sessions/`) and clears the cookie.
- **`requireAuth` middleware** — checks `req.session.user`; if missing,
  redirects to `/login?redirect=<originalUrl>` so the user lands back where
  they were headed after logging in.

## Why a file session store

By default, `express-session` uses an in-memory store, which:
- loses every session when the server restarts, and
- doesn't work if you ever run more than one server process/instance.

`session-file-store` writes each session as a small JSON file under
`sessions/`, so sessions survive restarts. (For a real production app with
multiple servers, a shared store like Redis is the more common choice — a
file store is a good fit for a single-instance app or an assignment like
this one.)

## Notes for production (worth mentioning if asked)

- Replace the hardcoded `secret` in `server.js` with a long random value
  from an environment variable.
- Set `cookie.secure: true` once served over HTTPS.
- Replace the in-code `users` array with a real database.
