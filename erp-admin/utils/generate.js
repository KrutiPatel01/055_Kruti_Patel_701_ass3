const crypto = require('crypto');
const Counter = require('../models/Counter');

// EMP001, EMP002, ... (atomic increment so two inserts never get the same id)
async function generateEmpId() {
  const c = await Counter.findByIdAndUpdate('empid', { $inc: { seq: 1 } }, { new: true, upsert: true });
  return 'EMP' + String(c.seq).padStart(3, '0');
}

// Random 8-char password with letters + digits (no confusing characters like 0/O, 1/l)
function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

module.exports = { generateEmpId, generatePassword };
