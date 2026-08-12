const mongoose = require('mongoose');

const ledgerTransactionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    type: {
      type: String,
      enum: ['sale', 'payment', 'adjustment', 'opening_balance', 'refund'],
      required: true,
    },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balanceAfter: { type: Number, default: 0 },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, enum: ['Entry', 'Payment', 'Shop', null], default: null },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    voided: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ledgerTransactionSchema.index({ shopId: 1, date: 1, createdAt: 1 });
ledgerTransactionSchema.index({ referenceId: 1, referenceType: 1 });

module.exports = mongoose.model('LedgerTransaction', ledgerTransactionSchema);
