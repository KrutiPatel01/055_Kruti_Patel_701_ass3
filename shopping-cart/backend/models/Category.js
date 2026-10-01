// 2-level categories:
//   level 1 (parent = null)      e.g. "Electronics"
//   level 2 (parent = level 1)   e.g. "Mobiles"
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, parent: 1 }, { unique: true }); // no duplicate names under the same parent

module.exports = mongoose.model('Category', categorySchema);
