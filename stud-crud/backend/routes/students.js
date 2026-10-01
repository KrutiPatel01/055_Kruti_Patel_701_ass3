const express = require('express');
const { Op, ValidationError } = require('sequelize');
const Student = require('../models/Student');

const router = express.Router();

// Turns Sequelize validation / unique errors into { field: message } and a 400 response
function sendValidationError(err, res) {
  const errors = {};
  err.errors.forEach((e) => {
    if (e.path && !errors[e.path]) errors[e.path] = e.message;
  });
  return res.status(400).json({ message: 'Validation failed.', errors });
}

// only allow these fields from the request body
const pick = (b) => ({
  rollNo: b.rollNo === undefined ? b.rollNo : String(b.rollNo).trim(),
  name: b.name === undefined ? b.name : String(b.name).trim(),
  email: b.email === undefined ? b.email : String(b.email).trim(),
  course: b.course === undefined ? b.course : String(b.course).trim(),
  age: b.age === '' || b.age === undefined ? null : Number(b.age)
});

// READ all (optional ?q= search on name / rollNo / course)
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const where = q
    ? { [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { rollNo: { [Op.like]: `%${q}%` } }, { course: { [Op.like]: `%${q}%` } }] }
    : {};
  const students = await Student.findAll({ where, order: [['id', 'DESC']] });
  res.json(students);
});

// READ one
router.get('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json(student);
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const student = await Student.create(pick(req.body));
    res.status(201).json(student);
  } catch (err) {
    if (err instanceof ValidationError) return sendValidationError(err, res); // includes unique-constraint errors
    throw err;
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  try {
    await student.update(pick(req.body));
    res.json(student);
  } catch (err) {
    if (err instanceof ValidationError) return sendValidationError(err, res);
    throw err;
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  await student.destroy();
  res.json({ message: 'Student deleted.' });
});

module.exports = router;
