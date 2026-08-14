const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
    // 'paid' = money Chirayath gives the supplier (normal case, reduces what's owed).
    // 'received' = money Chirayath gets back from the supplier (advance/correction, increases what's owed).
    direction: { type: String, enum: ['paid', 'received'], default: 'paid' },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    paymentDate: { type: Date, required: true, default: Date.now },
    referenceNumber: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['manual', 'purchase'], default: 'manual' },
    status: { type: String, enum: ['active', 'voided'], default: 'active' },
    voidedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierPaymentSchema.index({ shopId: 1, paymentDate: -1 });
supplierPaymentSchema.index({ status: 1 });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);
