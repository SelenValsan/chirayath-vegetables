const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Shop name is required'], trim: true },
    ownerName: { type: String, trim: true, default: '' },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s]{7,15}$/, 'Please provide a valid phone number'],
    },
    alternatePhone: { type: String, trim: true, default: '' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^$|^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    address: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    // customer = they buy from us (existing/default behavior, unchanged for all existing records).
    // supplier = we buy from them. both = they do both, tracked as two separate balances below.
    partyType: { type: String, enum: ['customer', 'supplier', 'both'], default: 'customer' },
    openingBalance: { type: Number, default: 0 }, // receivable side: what they owed us at the start
    currentBalance: { type: Number, default: 0 }, // receivable side: what they currently owe us
    payableOpeningBalance: { type: Number, default: 0 }, // payable side: what we owed them at the start
    payableBalance: { type: Number, default: 0 }, // payable side: what we currently owe them
    paymentPreference: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    notes: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'overdue', 'archived'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

shopSchema.index({ name: 'text', ownerName: 'text', phone: 'text' });
shopSchema.index({ status: 1 });
shopSchema.index({ isDeleted: 1 });
shopSchema.index({ partyType: 1 });

module.exports = mongoose.model('Shop', shopSchema);
