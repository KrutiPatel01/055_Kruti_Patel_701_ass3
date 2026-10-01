const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    grant: { type: String, enum: ['yes', 'no'], default: 'no' } // grant yes / no
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
