const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, unique: true },
    defaultUnit: {
      type: String,
      enum: ['kg', 'g', 'piece', 'bundle', 'box', 'crate'],
      default: 'kg',
    },
    defaultRate: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
