// CRUD routes for employees (all protected by requireAdmin in server.js)
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const Employee = require('../models/Employee');
const { generateEmpId, generatePassword } = require('../utils/generate');
const { sendWelcomeEmail } = require('../utils/mailer');

const router = express.Router();

const DEPARTMENTS = ['HR', 'Finance', 'IT', 'Sales', 'Marketing', 'Operations'];

// ---------- validation rules (same for add and edit) ----------
const rules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Enter a valid email.'),
  body('phone').trim().optional({ checkFalsy: true }).matches(/^[0-9+\- ]{7,15}$/).withMessage('Enter a valid phone number.'),
  body('department').isIn(DEPARTMENTS).withMessage('Choose a department.'),
  body('designation').trim().notEmpty().withMessage('Designation is required.'),
  body('basic').isFloat({ min: 0 }).withMessage('Basic salary must be a number >= 0.'),
  body('hraPercent').isFloat({ min: 0, max: 100 }).withMessage('HRA % must be between 0 and 100.'),
  body('daPercent').isFloat({ min: 0, max: 100 }).withMessage('DA % must be between 0 and 100.'),
  body('pfPercent').isFloat({ min: 0, max: 100 }).withMessage('PF % must be between 0 and 100.'),
  body('professionalTax').isFloat({ min: 0 }).withMessage('Professional tax must be >= 0.')
];

function errorMap(req) {
  const map = {};
  validationResult(req).array().forEach((e) => {
    if (!map[e.path]) map[e.path] = e.msg;
  });
  return map;
}

function pickFields(b) {
  return {
    name: b.name,
    email: b.email,
    phone: b.phone,
    department: b.department,
    designation: b.designation,
    basic: Number(b.basic),
    hraPercent: Number(b.hraPercent),
    daPercent: Number(b.daPercent),
    pfPercent: Number(b.pfPercent),
    professionalTax: Number(b.professionalTax)
  };
}

const blankEmployee = { name: '', email: '', phone: '', department: '', designation: '', basic: '', hraPercent: 40, daPercent: 10, pfPercent: 12, professionalTax: 200 };

// ---------- READ: list (with simple search) ----------
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  const safe = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex chars typed by the user
  const filter = q ? { $or: [{ name: safe }, { empid: safe }, { department: safe }] } : {};
  const employees = await Employee.find(filter).sort({ empid: 1 });
  const rows = employees.map((e) => ({ emp: e, salary: e.calculateSalary() }));
  res.render('employees/list', { rows, q });
});

// ---------- CREATE ----------
router.get('/new', (req, res) => {
  res.render('employees/form', { mode: 'new', emp: blankEmployee, errors: {}, departments: DEPARTMENTS });
});

router.post('/', rules, async (req, res) => {
  const errors = errorMap(req);

  if (!errors.email && (await Employee.exists({ email: req.body.email.toLowerCase().trim() }))) {
    errors.email = 'An employee with this email already exists.';
  }

  if (Object.keys(errors).length) {
    return res.status(400).render('employees/form', { mode: 'new', emp: req.body, errors, departments: DEPARTMENTS });
  }

  const plainPassword = generatePassword();
  const emp = await Employee.create({
    ...pickFields(req.body),
    empid: await generateEmpId(),
    passwordHash: await bcrypt.hash(plainPassword, 10) // encrypted (hashed) before saving
  });

  // send login details by email (a mail failure must not undo the insert)
  let mailNote = 'Login details emailed to ' + emp.email + '.';
  try {
    await sendWelcomeEmail(emp, plainPassword);
  } catch (err) {
    console.error('Email failed:', err.message);
    mailNote = 'Employee saved, but the email could not be sent (' + err.message + ').';
  }

  req.session.flash = { type: 'success', text: `Employee ${emp.empid} created. ${mailNote}` };
  res.redirect('/employees');
});

// ---------- READ one: details + salary slip ----------
router.get('/:id', async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).send('Employee not found. <a href="/employees">Back</a>');
  res.render('employees/show', { emp, salary: emp.calculateSalary() });
});

// ---------- UPDATE ----------
router.get('/:id/edit', async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).send('Employee not found. <a href="/employees">Back</a>');
  res.render('employees/form', { mode: 'edit', emp, errors: {}, departments: DEPARTMENTS });
});

router.post('/:id/edit', rules, async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).send('Employee not found. <a href="/employees">Back</a>');

  const errors = errorMap(req);
  if (!errors.email && (await Employee.exists({ email: req.body.email.toLowerCase().trim(), _id: { $ne: emp._id } }))) {
    errors.email = 'Another employee already uses this email.';
  }

  if (Object.keys(errors).length) {
    return res.status(400).render('employees/form', {
      mode: 'edit',
      emp: { ...req.body, _id: emp._id, empid: emp.empid },
      errors,
      departments: DEPARTMENTS
    });
  }

  Object.assign(emp, pickFields(req.body)); // empid and password are NOT changed on edit
  await emp.save();
  req.session.flash = { type: 'success', text: `Employee ${emp.empid} updated.` };
  res.redirect('/employees');
});

// ---------- extra: reset password (generates a new one and emails it) ----------
router.post('/:id/reset-password', async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).send('Employee not found. <a href="/employees">Back</a>');

  const plainPassword = generatePassword();
  emp.passwordHash = await bcrypt.hash(plainPassword, 10);
  await emp.save();

  let text = `New password generated and emailed to ${emp.email}.`;
  try {
    await sendWelcomeEmail(emp, plainPassword);
  } catch (err) {
    text = 'Password reset, but the email could not be sent (' + err.message + ').';
  }
  req.session.flash = { type: 'success', text };
  res.redirect('/employees/' + emp._id);
});

// ---------- DELETE ----------
router.post('/:id/delete', async (req, res) => {
  const emp = await Employee.findByIdAndDelete(req.params.id);
  req.session.flash = { type: 'success', text: emp ? `Employee ${emp.empid} deleted.` : 'Employee not found.' };
  res.redirect('/employees');
});

module.exports = router;
