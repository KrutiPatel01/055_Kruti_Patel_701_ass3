// Same schema/collection ("employees") as the ERP admin panel (Q4).
// Employees are created by the admin there; this site only reads them.
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    empid: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    joinDate: { type: Date, default: Date.now },
    basic: { type: Number, required: true, min: 0 },
    hraPercent: { type: Number, default: 40 },
    daPercent: { type: Number, default: 10 },
    pfPercent: { type: Number, default: 12 },
    professionalTax: { type: Number, default: 200 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
