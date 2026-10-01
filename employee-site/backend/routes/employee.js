const express = require('express');
const Employee = require('../models/Employee');

const router = express.Router();

// GET /api/employee/me   (token required) -> the logged-in employee's profile
router.get('/me', async (req, res) => {
  const emp = await Employee.findById(req.user.id).select('-passwordHash');
  if (!emp) return res.status(404).json({ message: 'Employee not found.' });
  res.json(emp);
});

module.exports = router;
