const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    type: { type: String, enum: ['entry', 'payment'], required: true },
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry', default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['active', 'void'], default: 'active' },
    voidedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

receiptSchema.index({ receiptNumber: 1 }, { unique: true });
receiptSchema.index({ shopId: 1, createdAt: -1 });

module.exports = mongoose.model('Receipt', receiptSchema);
