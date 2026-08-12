const mongoose = require('mongoose');

// Used for generating sequential, gap-free receipt numbers per year e.g. CV-2026-00001
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "receipt-2026"
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
