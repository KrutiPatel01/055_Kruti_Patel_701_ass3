const express = require('express');
const Leave = require('../models/Leave');

const router = express.Router();

// GET /api/leaves  -> only the logged-in employee's leaves, newest first
router.get('/', async (req, res) => {
  const leaves = await Leave.find({ employee: req.user.id }).sort({ date: -1 });
  res.json(leaves);
});

// POST /api/leaves   { date, reason, grant }
router.post('/', async (req, res) => {
  const { date, reason, grant } = req.body;
  const errors = {};

  if (!date || Number.isNaN(new Date(date).getTime())) errors.date = 'Please choose a valid date.';
  if (!reason || !String(reason).trim()) errors.reason = 'Reason is required.';
  else if (String(reason).length > 300) errors.reason = 'Reason can be at most 300 characters.';
  if (grant && !['yes', 'no'].includes(grant)) errors.grant = 'Grant must be yes or no.';

  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed.', errors });

  const leave = await Leave.create({
    employee: req.user.id,
    date,
    reason: String(reason).trim(),
    grant: grant || 'no'
  });
  res.status(201).json(leave);
});

module.exports = router;
