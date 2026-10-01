# Q5 — Employee Site (Mongoose + Express + React, JWT login)

Employees created by the admin in **Q4** log in here with their **Employee ID + password**.
The server returns a **JWT**; React keeps it in `localStorage` and sends it as
`Authorization: Bearer <token>` on every request.

- **Home** – links to the two pages
- **Page 1 – Profile** – shows the logged-in employee's details
- **Page 2 – Leave** – form (date, reason, grant yes/no) + list of my applications
- **Logout** – removes the token

## Folder structure
```
employee-site/
├── backend/                 # Express + Mongoose API (port 5005)
│   ├── server.js
│   ├── .env                 # PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN
│   ├── models/              # Employee (same collection as Q4), Leave
│   ├── routes/              # auth (login), employee (me), leaves (list/add)
│   ├── middleware/auth.js   # verifies the JWT
│   └── seed.js              # optional demo employee
└── frontend/                # React (Vite) app (port 5173, proxies /api to 5005)
    └── src/ { App, AuthContext, api.js, components/, pages/ }
```

## Run
Start MongoDB, then in two terminals:
```bash
# terminal 1
cd backend
npm install
npm run seed      # optional: creates EMP900 / demo1234 (skip if you used the Q4 admin panel)
npm start

# terminal 2
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**.

The backend uses the same database as Q4 (`mongodb://127.0.0.1:27017/erp`), so run Q4, add an
employee, and log in here with the emailed id/password.

## API
| Method | URL | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | – | `{empid, password}` → `{token, employee}` |
| GET | `/api/employee/me` | JWT | own profile |
| GET | `/api/leaves` | JWT | own leaves |
| POST | `/api/leaves` | JWT | `{date, reason, grant}` |

## Viva notes
- Passwords are compared with `bcrypt.compare` against the hash stored by Q4.
- JWT payload has only `id` and `empid`; it is signed with `JWT_SECRET` and expires (2h).
- A `401` from the API makes the React app clear the token and go back to the login page.
- `ProtectedRoute` guards the pages in React; the **real** protection is the `verifyToken`
  middleware on the server.
