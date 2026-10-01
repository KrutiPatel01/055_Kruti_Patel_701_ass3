// Optional: creates a demo employee so you can test this site without running the Q4 admin panel.
//   npm run seed      ->  login with  EMP900 / demo1234
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp');
  await Employee.deleteOne({ empid: 'EMP900' });
  await Employee.create({
    empid: 'EMP900',
    passwordHash: await bcrypt.hash('demo1234', 10),
    name: 'Demo Employee',
    email: 'demo.employee@example.com',
    phone: '9876543210',
    department: 'IT',
    designation: 'Software Developer',
    basic: 40000
  });
  console.log('Demo employee created -> EMP900 / demo1234');
  await mongoose.disconnect();
})();
