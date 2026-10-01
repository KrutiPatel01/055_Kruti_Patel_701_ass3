const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const router = express.Router();

// POST /api/auth/login   { empid, password }  ->  { token, employee }
router.post('/login', async (req, res) => {
  const empid = String(req.body.empid || '').trim().toUpperCase();
  const password = String(req.body.password || '');

  if (!empid || !password) {
    return res.status(400).json({ message: 'Employee ID and password are required.' });
  }

  const emp = await Employee.findOne({ empid });
  const ok = emp && (await bcrypt.compare(password, emp.passwordHash));
  if (!ok) return res.status(401).json({ message: 'Invalid employee ID or password.' });

  const token = jwt.sign({ id: emp._id, empid: emp.empid }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });

  res.json({ token, employee: { id: emp._id, empid: emp.empid, name: emp.name } });
});

module.exports = router;
