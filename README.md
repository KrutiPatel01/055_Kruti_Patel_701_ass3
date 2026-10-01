# Full-Stack Practical Assignment 3

| Q | Folder | What | Port |
|---|---|---|---|
| 1 | `reg-form/` | Registration form: Express + EJS + express-validator + Multer uploads | 3000 |
| 2 | `login-app/` | Login with **file** session store, 2 protected routes, logout | 3000 |
| 3 | `login-redis-app/` | Login with **Redis** session store, 2 protected routes, logout | 5000 |
| 4 | `erp-admin/` | ERP admin panel: session login, employee CRUD, salary calc, email, bcrypt (Mongoose + EJS) | 3004 |
| 5 | `employee-site/` | Employee site: JWT login, profile, leave application (Express + Mongoose + React) | 5005 / 5173 |
| 6 | `free-api-utility/` | Weather utility using the free Open-Meteo API from frontend and backend | 5006 |
| 7 | `shopping-cart/` | MERN shopping cart: admin site + user site, 2-level categories, products | 5007 / 5173 / 5174 |
| 8 | `stud-crud/` | Student CRUD with Sequelize (Express + Sequelize + React) | 5008 / 5173 |

Every folder has its own `README.md` with setup steps. In each folder run `npm install` first
(`node_modules` is not included in the zip).

Needs: **Node 18+**, and depending on the question **Redis** (Q3), **MongoDB** (Q4, Q5, Q7), **MySQL** (Q8).
Run Q4 first if you want to log in to Q5 with an employee created by the admin panel
(both use the database `erp`).
