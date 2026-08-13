const LedgerTransaction = require('../models/LedgerTransaction');
const Shop = require('../models/Shop');

/**
 * Creates a ledger transaction row. balanceAfter is a placeholder here -
 * the authoritative value is always set by recalculateShopBalance().
 */
async function createLedgerEntry({ shopId, type, debit = 0, credit = 0, referenceId = null, referenceType = null, description = '', date = new Date(), createdBy = null }) {
  const tx = await LedgerTransaction.create({
    shopId,
    type,
    debit,
    credit,
    balanceAfter: 0,
    referenceId,
    referenceType,
    description,
    date,
    createdBy,
  });
  return tx;
}

/**
 * Voids a ledger transaction tied to a given reference (Entry or Payment),
 * excluding it from all future balance calculations while preserving audit history.
 */
async function voidLedgerEntryByReference(referenceId, referenceType) {
  await LedgerTransaction.updateMany(
    { referenceId, referenceType, voided: false },
    { $set: { voided: true } }
  );
}

async function updateLedgerEntryByReference(referenceId, referenceType, updates) {
  await LedgerTransaction.updateMany(
    { referenceId, referenceType, voided: false },
    { $set: updates }
  );
}

/**
 * THE source of truth for shop balances.
 * Replays every non-voided ledger transaction for a shop in chronological order,
 * starting from ZERO, and rewrites balanceAfter on each row.
 * The shop's opening balance is represented entirely by its own 'opening_balance'
 * ledger transaction (created in shopController) - it is NOT added again here,
 * since that would double-count it. This guarantees the balance is always
 * correct no matter how many edits/voids have happened, without relying on
 * incremental +/- math that can drift.
 */
async function recalculateShopBalance(shopId) {
  const shop = await Shop.findById(shopId);
  if (!shop) return null;

  const transactions = await LedgerTransaction.find({ shopId, voided: false }).sort({ date: 1, createdAt: 1 });

  let running = 0;
  const bulkOps = [];

  for (const tx of transactions) {
    running = running + (tx.debit || 0) - (tx.credit || 0);
    if (tx.balanceAfter !== running) {
      bulkOps.push({
        updateOne: { filter: { _id: tx._id }, update: { $set: { balanceAfter: running } } },
      });
    }
  }

  if (bulkOps.length > 0) {
    await LedgerTransaction.bulkWrite(bulkOps);
  }

  shop.currentBalance = running;
  // auto-flag shops that owe money for a while as overdue is handled in a scheduled job in a real
  // deployment; here we just keep status manually managed unless it's inactive/archived already.
  await shop.save();

  return running;
}

module.exports = {
  createLedgerEntry,
  voidLedgerEntryByReference,
  updateLedgerEntryByReference,
  recalculateShopBalance,
};
