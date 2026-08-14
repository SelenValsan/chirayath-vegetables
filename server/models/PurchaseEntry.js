const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
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

// A PurchaseEntry is what Chirayath bought FROM a supplier - the mirror of Entry,
// which is what Chirayath sold TO a shop.
const purchaseEntrySchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: {
      type: [purchaseItemSchema],
      validate: [(arr) => arr.length > 0, 'Purchase must contain at least one product'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    additionalCharges: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    previousBalance: { type: Number, required: true },
    amountPaid: { type: Number, default: 0, min: 0 },
    remainingBalance: { type: Number, required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierPayment', default: null },
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

purchaseEntrySchema.index({ shopId: 1, date: -1 });
purchaseEntrySchema.index({ status: 1 });

module.exports = mongoose.model('PurchaseEntry', purchaseEntrySchema);
