const Counter = require('../models/Counter');
const Receipt = require('../models/Receipt');

async function generateReceiptNumber(date = new Date()) {
  const year = date.getFullYear();
  const counterId = `receipt-${year}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(5, '0');
  return `CV-${year}-${padded}`;
}

async function createEntryReceipt({ shop, entry, createdBy }) {
  const receiptNumber = await generateReceiptNumber(entry.date);
  const snapshot = {
    businessName: 'Chirayath Vegetables',
    tagline: 'Dine with Nature',
    shopName: shop.name,
    shopPhone: shop.phone,
    shopAddress: shop.address,
    items: entry.items,
    subtotal: entry.subtotal,
    previousBalance: entry.previousBalance,
    discount: entry.discount,
    additionalCharges: entry.additionalCharges,
    grandTotal: entry.total,
    amountPaid: entry.amountPaid,
    remainingBalance: entry.remainingBalance,
    date: entry.date,
  };
  return Receipt.create({
    receiptNumber,
    shopId: shop._id,
    type: 'entry',
    entryId: entry._id,
    snapshot,
    createdBy,
  });
}

async function createPaymentReceipt({ shop, payment, balanceBefore, createdBy }) {
  const receiptNumber = await generateReceiptNumber(payment.paymentDate);
  const snapshot = {
    businessName: 'Chirayath Vegetables',
    tagline: 'Dine with Nature',
    shopName: shop.name,
    shopPhone: shop.phone,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    balanceBefore,
    balanceAfter: balanceBefore - payment.amount,
    date: payment.paymentDate,
  };
  return Receipt.create({
    receiptNumber,
    shopId: shop._id,
    type: 'payment',
    paymentId: payment._id,
    snapshot,
    createdBy,
  });
}

async function voidReceiptByReference(referenceId, field) {
  await Receipt.updateMany(
    { [field]: referenceId, status: 'active' },
    { $set: { status: 'void', voidedAt: new Date() } }
  );
}

module.exports = { generateReceiptNumber, createEntryReceipt, createPaymentReceipt, voidReceiptByReference };
