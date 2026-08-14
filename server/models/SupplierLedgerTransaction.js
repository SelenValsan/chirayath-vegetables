const mongoose = require('mongoose');

// The PAYABLE-side ledger: what Chirayath owes a business (kept entirely separate
// from LedgerTransaction, which tracks the RECEIVABLE side - what a business owes
// Chirayath). Both reference the SAME Shop document via shopId, since a business
// can be a customer, a supplier, or both at once. debit here = increases what
// Chirayath owes; credit = decreases what Chirayath owes. This never touches
// Shop.currentBalance/openingBalance (receivable fields) - only payableBalance.
const supplierLedgerTransactionSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    type: {
      type: String,
      enum: ['purchase', 'payment', 'adjustment', 'opening_balance', 'refund'],
      required: true,
    },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    balanceAfter: { type: Number, default: 0 },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceType: { type: String, enum: ['PurchaseEntry', 'SupplierPayment', 'Shop', null], default: null },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    voided: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierLedgerTransactionSchema.index({ shopId: 1, date: 1, createdAt: 1 });
supplierLedgerTransactionSchema.index({ referenceId: 1, referenceType: 1 });

module.exports = mongoose.model('SupplierLedgerTransaction', supplierLedgerTransactionSchema);
