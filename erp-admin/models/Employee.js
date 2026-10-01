// NOTE: the employee site (Q5) uses the SAME collection ("employees") and the same fields.
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    empid: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true }, // bcrypt hash, never the plain password
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    joinDate: { type: Date, default: Date.now },

    // ---- salary structure ----
    basic: { type: Number, required: true, min: 0 }, // monthly basic pay
    hraPercent: { type: Number, default: 40, min: 0 }, // House Rent Allowance, % of basic
    daPercent: { type: Number, default: 10, min: 0 }, // Dearness Allowance, % of basic
    pfPercent: { type: Number, default: 12, min: 0 }, // Provident Fund deduction, % of basic
    professionalTax: { type: Number, default: 200, min: 0 } // fixed monthly deduction
  },
  { timestamps: true }
);

// ---- salary calculation ----
// gross = basic + HRA + DA
// deductions = PF + professional tax
// net = gross - deductions
employeeSchema.methods.calculateSalary = function () {
  const basic = this.basic;
  const hra = (basic * this.hraPercent) / 100;
  const da = (basic * this.daPercent) / 100;
  const gross = basic + hra + da;
  const pf = (basic * this.pfPercent) / 100;
  const tax = this.professionalTax;
  const deductions = pf + tax;
  const net = gross - deductions;
  const r = (n) => Math.round(n * 100) / 100;
  return { basic: r(basic), hra: r(hra), da: r(da), gross: r(gross), pf: r(pf), tax: r(tax), deductions: r(deductions), net: r(net) };
};

module.exports = mongoose.model('Employee', employeeSchema);
