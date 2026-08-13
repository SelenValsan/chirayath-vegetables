const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
    // 'received' = money coming in from the shop (normal collection).
    // 'paid' = money going out to the shop (refund, advance, correction) - increases what they owe.
    direction: { type: String, enum: ['received', 'paid'], default: 'received' },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    paymentDate: { type: Date, required: true, default: Date.now },
    referenceNumber: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['manual', 'entry'], default: 'manual' },
    status: { type: String, enum: ['active', 'voided'], default: 'active' },
    voidedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ shopId: 1, paymentDate: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
