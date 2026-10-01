# Q4 — ERP Admin Panel (Express + Mongoose + EJS)

Admin logs in with a **session**, then does full **CRUD on employees**. Employee id and
password are **generated automatically**, the password is **hashed with bcrypt**, the
**salary is calculated** (gross / deductions / net) and an **email** with the login details
is sent when an employee is inserted. Logout destroys the session.

## Folder structure
```
erp-admin/
├── server.js               # app setup, session, admin login/logout, DB connect
├── .env / .env.example     # PORT, MONGO_URI, SESSION_SECRET, admin + SMTP settings
├── models/                 # Admin, Employee (with calculateSalary()), Counter (empid sequence)
├── routes/employees.js     # list, add, view, edit, delete, reset password
├── middleware/auth.js      # requireAdmin
├── utils/generate.js       # generateEmpId(), generatePassword()
├── utils/mailer.js         # nodemailer welcome email
├── views/                  # login, employees/{list,form,show}, partials
└── public/style.css
```

## Run
```bash
npm install
# make sure MongoDB is running (mongodb://127.0.0.1:27017)
npm start
```
Open **http://localhost:3004** → login `admin / admin123` (created on first start).

## Email
Fill `SMTP_*` in `.env` (for Gmail use an *App Password*). If `SMTP_HOST` is empty the
email is only printed in the console, so the app still works without any mail account.

## Salary formula (in `models/Employee.js`)
```
HRA   = basic * hra%          DA = basic * da%
Gross = basic + HRA + DA
PF    = basic * pf%           Deductions = PF + professional tax
Net   = Gross - Deductions
```

## Viva notes
- Passwords are never stored in plain text: `bcrypt.hash(plain, 10)`; the plain one exists
  only in memory long enough to be emailed.
- `empid` comes from an atomic counter (`findByIdAndUpdate ... $inc`), so no duplicates.
- Sessions are stored in MongoDB (`connect-mongo`) and the id is regenerated on login.
- The employee site (Q5) reads the same `employees` collection to let employees log in.
