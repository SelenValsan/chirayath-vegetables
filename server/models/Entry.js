const mongoose = require('mongoose');

const entryItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [0.001, 'Quantity must be greater than 0'] },
    unit: { type: String, enum: ['kg', 'g', 'piece', 'bundle', 'box', 'crate'], required: true },
    rate: { type: Number, required: true, min: [0, 'Rate cannot be negative'] },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: {
      type: [entryItemSchema],
      validate: [(arr) => arr.length > 0, 'Entry must contain at least one product'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    additionalCharges: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    previousBalance: { type: Number, required: true },
    amountPaid: { type: Number, default: 0, min: 0 },
    remainingBalance: { type: Number, required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'voided'], default: 'active' },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

entrySchema.index({ shopId: 1, date: -1 });
entrySchema.index({ status: 1 });

module.exports = mongoose.model('Entry', entrySchema);
