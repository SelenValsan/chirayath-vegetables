require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Entry = require('../models/Entry');
const Payment = require('../models/Payment');
const LedgerTransaction = require('../models/LedgerTransaction');
const Receipt = require('../models/Receipt');
const Counter = require('../models/Counter');

const { createLedgerEntry, recalculateShopBalance } = require('../services/ledgerService');
const { createEntryReceipt, createPaymentReceipt } = require('../services/receiptService');

const PRODUCT_LIST = [
  { name: 'Tomato', defaultUnit: 'kg', defaultRate: 32 },
  { name: 'Onion', defaultUnit: 'kg', defaultRate: 28 },
  { name: 'Potato', defaultUnit: 'kg', defaultRate: 24 },
  { name: 'Carrot', defaultUnit: 'kg', defaultRate: 40 },
  { name: 'Cabbage', defaultUnit: 'piece', defaultRate: 25 },
  { name: 'Beetroot', defaultUnit: 'kg', defaultRate: 35 },
  { name: 'Beans', defaultUnit: 'kg', defaultRate: 45 },
  { name: 'Green Chilli', defaultUnit: 'kg', defaultRate: 60 },
  { name: 'Cucumber', defaultUnit: 'kg', defaultRate: 22 },
  { name: 'Brinjal', defaultUnit: 'kg', defaultRate: 30 },
  { name: 'Pumpkin', defaultUnit: 'kg', defaultRate: 20 },
  { name: 'Ginger', defaultUnit: 'kg', defaultRate: 90 },
  { name: 'Garlic', defaultUnit: 'kg', defaultRate: 110 },
];

const SHOP_LIST = [
  { name: 'Green Mart', ownerName: 'Rajesh Nair', phone: '9876543210', location: 'MG Road' },
  { name: 'Fresh Market', ownerName: 'Suresh Kumar', phone: '9876543211', location: 'Station Road' },
  { name: 'City Stores', ownerName: 'Anitha Menon', phone: '9876543212', location: 'Chembukkavu' },
  { name: 'Daily Needs', ownerName: 'Bijoy Thomas', phone: '9876543213', location: 'Ollur' },
  { name: 'Family Supermarket', ownerName: 'Sajitha Rajan', phone: '9876543214', location: 'Round East' },
  { name: 'Nature Fresh', ownerName: 'Manoj Pillai', phone: '9876543215', location: 'Kuriachira' },
  { name: 'Green Basket', ownerName: 'Deepa Varma', phone: '9876543216', location: 'Poothole' },
  { name: 'Village Grocers', ownerName: 'Vinod K', phone: '9876543217', location: 'Punkunnam' },
  { name: 'Sunrise Traders', ownerName: 'Latha Joseph', phone: '9876543218', location: 'Viyyur' },
  { name: 'Farm Fresh Corner', ownerName: 'George Mathew', phone: '9876543219', location: 'Ayyanthole' },
  { name: 'Everyday Mart', ownerName: 'Priya Krishnan', phone: '9876543220', location: 'Thaikkad' },
  { name: 'Om Sakthi Stores', ownerName: 'Muthu Selvam', phone: '9876543221', location: 'Nadavaramba' },
  { name: 'City Fresh Vegetables', ownerName: 'Faisal Rahman', phone: '9876543222', location: 'Koorkenchery' },
  { name: 'Valley Grocers', ownerName: 'Teena Sebastian', phone: '9876543223', location: 'Pattikkad' },
];

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function pick(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function run() {
  await connectDB();
  const destroy = process.argv.includes('--destroy');

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Entry.deleteMany({}),
    Payment.deleteMany({}),
    LedgerTransaction.deleteMany({}),
    Receipt.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  if (destroy) {
    console.log('Database cleared. Exiting (--destroy flag set).');
    return mongoose.connection.close();
  }

  console.log('Creating owner account...');
  const owner = await User.create({
    name: 'Chirayath Owner',
    email: 'owner@chirayathvegetables.com',
    password: 'password123',
    role: 'owner',
  });

  console.log('Creating products...');
  const products = await Product.insertMany(PRODUCT_LIST);

  console.log('Creating shops...');
  const shops = [];
  for (const s of SHOP_LIST) {
    const openingBalance = Math.random() > 0.5 ? randomBetween(0, 3000) : 0;
    const shop = await Shop.create({
      ...s,
      address: `${s.location}, Thrissur, Kerala`,
      openingBalance,
      currentBalance: openingBalance,
      paymentPreference: pick(['Cash', 'UPI', 'Bank Transfer'], 1)[0],
      status: 'active',
      createdBy: owner._id,
      updatedBy: owner._id,
    });
    if (openingBalance > 0) {
      await createLedgerEntry({
        shopId: shop._id,
        type: 'opening_balance',
        debit: openingBalance,
        referenceId: shop._id,
        referenceType: 'Shop',
        description: 'Opening balance',
        date: shop.createdAt,
        createdBy: owner._id,
      });
    }
    shops.push(shop);
  }

  console.log('Creating sample entries and payments over the last 20 days...');
  const today = new Date();

  for (const shop of shops) {
    const numEntries = Math.floor(Math.random() * 5) + 3; // 3-7 entries per shop
    for (let i = 0; i < numEntries; i++) {
      const daysAgo = Math.floor(Math.random() * 20);
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - daysAgo);

      const chosenProducts = pick(products, Math.floor(Math.random() * 4) + 2); // 2-5 items
      const items = chosenProducts.map((p) => {
        const quantity = randomBetween(1, 15);
        const rate = p.defaultRate + randomBetween(-3, 3);
        const amount = Math.round(quantity * rate * 100) / 100;
        return {
          productId: p._id,
          productName: p.name,
          quantity,
          unit: p.defaultUnit,
          rate: Math.round(rate * 100) / 100,
          amount,
        };
      });

      const subtotal = Math.round(items.reduce((sum, it) => sum + it.amount, 0) * 100) / 100;
      const discount = Math.random() > 0.85 ? randomBetween(10, 50) : 0;
      const total = Math.round((subtotal - discount) * 100) / 100;
      const previousBalance = shop.currentBalance;
      const payNow = Math.random() > 0.4 ? Math.round(total * (Math.random() > 0.5 ? 1 : 0.5) * 100) / 100 : 0;
      const remainingBalance = Math.round((previousBalance + total - payNow) * 100) / 100;

      const entry = await Entry.create({
        shopId: shop._id,
        items,
        subtotal,
        discount,
        additionalCharges: 0,
        total,
        previousBalance,
        amountPaid: payNow,
        remainingBalance,
        date: entryDate,
        createdBy: owner._id,
        updatedBy: owner._id,
      });

      await createLedgerEntry({
        shopId: shop._id,
        type: 'sale',
        debit: total,
        referenceId: entry._id,
        referenceType: 'Entry',
        description: `Vegetable supply (${items.length} items)`,
        date: entryDate,
        createdBy: owner._id,
      });

      let payment = null;
      if (payNow > 0) {
        payment = await Payment.create({
          shopId: shop._id,
          amount: payNow,
          paymentMethod: pick(['Cash', 'UPI', 'Bank Transfer'], 1)[0],
          paymentDate: entryDate,
          source: 'entry',
          createdBy: owner._id,
          updatedBy: owner._id,
        });
        entry.paymentId = payment._id;
        await entry.save();

        await createLedgerEntry({
          shopId: shop._id,
          type: 'payment',
          credit: payNow,
          referenceId: payment._id,
          referenceType: 'Payment',
          description: 'Payment received with supply entry',
          date: entryDate,
          createdBy: owner._id,
        });
      }

      await recalculateShopBalance(shop._id);
      const freshShop = await Shop.findById(shop._id);
      shop.currentBalance = freshShop.currentBalance;

      const entryReceipt = await createEntryReceipt({ shop: freshShop, entry, createdBy: owner._id });
      if (payment) {
        await createPaymentReceipt({ shop: freshShop, payment, balanceBefore: previousBalance + total, createdBy: owner._id });
      }
      void entryReceipt;
    }

    // Occasionally record a standalone payment too
    if (Math.random() > 0.6) {
      const freshShop = await Shop.findById(shop._id);
      if (freshShop.currentBalance > 0) {
        const amt = Math.min(freshShop.currentBalance, randomBetween(200, 1500));
        const payDate = new Date();
        payDate.setDate(payDate.getDate() - Math.floor(Math.random() * 5));
        const balanceBefore = freshShop.currentBalance;
        const payment = await Payment.create({
          shopId: shop._id,
          amount: amt,
          paymentMethod: pick(['Cash', 'UPI', 'Bank Transfer', 'Cheque'], 1)[0],
          paymentDate: payDate,
          source: 'manual',
          notes: 'Partial settlement',
          createdBy: owner._id,
          updatedBy: owner._id,
        });
        await createLedgerEntry({
          shopId: shop._id,
          type: 'payment',
          credit: amt,
          referenceId: payment._id,
          referenceType: 'Payment',
          description: `Payment received (${payment.paymentMethod})`,
          date: payDate,
          createdBy: owner._id,
        });
        await recalculateShopBalance(shop._id);
        const updated = await Shop.findById(shop._id);
        await createPaymentReceipt({ shop: updated, payment, balanceBefore, createdBy: owner._id });
      }
    }
  }

  // Mark shops with high balances as overdue for realism
  await Shop.updateMany({ currentBalance: { $gt: 4000 } }, { $set: { status: 'overdue' } });

  console.log('\nSeed complete!');
  console.log('----------------------------------------');
  console.log('Login credentials:');
  console.log('  Email:    owner@chirayathvegetables.com');
  console.log('  Password: password123');
  console.log('----------------------------------------');

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
