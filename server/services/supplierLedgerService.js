const SupplierLedgerTransaction = require('../models/SupplierLedgerTransaction');
const Shop = require('../models/Shop');

async function createLedgerEntry({ shopId, type, debit = 0, credit = 0, referenceId = null, referenceType = null, description = '', date = new Date(), createdBy = null }) {
  return SupplierLedgerTransaction.create({
    shopId, type, debit, credit, balanceAfter: 0, referenceId, referenceType, description, date, createdBy,
  });
}

async function voidLedgerEntryByReference(referenceId, referenceType) {
  await SupplierLedgerTransaction.updateMany(
    { referenceId, referenceType, voided: false },
    { $set: { voided: true } }
  );
}

async function updateLedgerEntryByReference(referenceId, referenceType, updates) {
  await SupplierLedgerTransaction.updateMany(
    { referenceId, referenceType, voided: false },
    { $set: updates }
  );
}

/**
 * Source of truth for the PAYABLE balance (what Chirayath owes this business).
 * Completely separate from recalculateShopBalance() in ledgerService.js, which
 * handles the RECEIVABLE balance (currentBalance/openingBalance). This function
 * only ever writes to Shop.payableBalance - it never reads or modifies
 * currentBalance/openingBalance, so existing customer data is untouched no
 * matter how many purchases/supplier-payments are recorded.
 */
async function recalculatePayableBalance(shopId) {
  const shop = await Shop.findById(shopId);
  if (!shop) return null;

  const transactions = await SupplierLedgerTransaction.find({ shopId, voided: false }).sort({ date: 1, createdAt: 1 });

  let running = 0;
  const bulkOps = [];

  for (const tx of transactions) {
    running = running + (tx.debit || 0) - (tx.credit || 0);
    if (tx.balanceAfter !== running) {
      bulkOps.push({ updateOne: { filter: { _id: tx._id }, update: { $set: { balanceAfter: running } } } });
    }
  }

  if (bulkOps.length > 0) {
    await SupplierLedgerTransaction.bulkWrite(bulkOps);
  }

  shop.payableBalance = running;
  await shop.save();

  return running;
}

module.exports = {
  createLedgerEntry,
  voidLedgerEntryByReference,
  updateLedgerEntryByReference,
  recalculatePayableBalance,
};
