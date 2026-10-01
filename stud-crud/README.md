# Q8 — Student CRUD (Express + Sequelize + React)

CRUD (Create, Read, Update, Delete) on a **Student** table using **Sequelize** (MySQL) with an
Express API and a React front end.

## Folder structure
```
stud-crud/
├── backend/                 # Express 5 + Sequelize + mysql2 (port 5008)
│   ├── index.js             # server, creates the database + table on start
│   ├── .env                 # DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, PORT
│   ├── config/db.js         # Sequelize connection
│   ├── models/Student.js    # model + validations
│   └── routes/students.js   # CRUD routes
└── frontend/                # React (Vite) app (port 5173, proxies /api to 5008)
    └── src/ { App.jsx, api.js, styles.css }
```

## Run
1. Start MySQL and put your password in `backend/.env` (`DB_PASS=`).
2. Two terminals:
```bash
# terminal 1
cd backend
npm install
npm start          # creates database "student_db" and table "students" automatically

# terminal 2
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**.

## API
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/students?q=` | list (optional search) |
| GET | `/api/students/:id` | one student |
| POST | `/api/students` | create |
| PUT | `/api/students/:id` | update |
| DELETE | `/api/students/:id` | delete |

Student fields: `rollNo` (unique), `name`, `email` (unique, valid email), `course`, `age` (15–100).

## Viva notes
- `sequelize.define()` creates the model; `sequelize.sync()` creates the table if it doesn't exist.
- Model-level validators (`notEmpty`, `isEmail`, `min/max`, `unique`) produce the error messages, and
  the route converts them into `{ field: message }` with HTTP 400 so React can show them under each field.
- `findAll`, `findByPk`, `create`, `update`, `destroy` are the Sequelize methods behind the CRUD routes.
- Express 5 forwards errors thrown in `async` handlers to the error middleware automatically.
