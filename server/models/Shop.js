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
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
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

module.exports = mongoose.model('Shop', shopSchema);
