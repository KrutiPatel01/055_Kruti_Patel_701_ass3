// Student CRUD API - Express 5 + Sequelize (MySQL)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const sequelize = require('./config/db');
require('./models/Student'); // registers the model before sync()

const app = express();
const PORT = process.env.PORT || 5008;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/students', require('./routes/students'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found.' }));

// Express 5 forwards errors from async handlers here automatically
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error: ' + err.message });
});

async function start() {
  // create the database if it does not exist yet
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || ''
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'student_db'}\``);
  await conn.end();

  await sequelize.authenticate();
  await sequelize.sync(); // creates the "students" table if missing
  console.log('MySQL connected, tables ready');

  app.listen(PORT, () => console.log(`Student API running at http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Could not start (is MySQL running and .env correct?):', err.message);
  process.exit(1);
});
