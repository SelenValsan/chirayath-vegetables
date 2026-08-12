import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Loader2, Save, Printer } from 'lucide-react';
import * as shopService from '../services/shopService';
import * as productService from '../services/productService';
import * as entryService from '../services/entryService';
import { Card, CardHeading } from '../components/Card';
import Select from '../components/Select';
import Input from '../components/Input';
import Button from '../components/Button';
import ProductEntryRow from '../components/ProductEntryRow';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { formatCurrency } from '../utils/currency';

const emptyItem = () => ({ productName: '', productId: undefined, quantity: '', unit: 'kg', rate: '' });

export default function EntryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopId, setShopId] = useState(searchParams.get('shopId') || '');
  const [selectedShop, setSelectedShop] = useState(null);
  const [items, setItems] = useState([emptyItem()]);
  const [discount, setDiscount] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      shopService.getShops({ limit: 100, status: 'active' }),
      productService.getProducts({ status: 'active' }),
    ]).then(([shopsRes, productsRes]) => {
      setShops(shopsRes.data);
      setProducts(productsRes);
    }).catch((err) => toast.error(err.message || 'Failed to load form data'));
  }, []);

  useEffect(() => {
    if (isEdit) {
      entryService.getEntry(id).then((entry) => {
        setShopId(entry.shopId._id || entry.shopId);
        setItems(entry.items.map((it) => ({
          productName: it.productName, productId: it.productId, quantity: it.quantity, unit: it.unit, rate: it.rate,
        })));
        setDiscount(entry.discount || '');
        setAdditionalCharges(entry.additionalCharges || '');
        setAmountPaid(entry.amountPaid || '');
        setDate(entry.date.slice(0, 10));
        setNotes(entry.notes || '');
      }).catch((err) => toast.error(err.message || 'Failed to load entry')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!shopId) { setSelectedShop(null); return; }
    shopService.getShop(shopId).then((res) => setSelectedShop(res.shop)).catch(() => {});
  }, [shopId]);

  const updateItem = useCallback((index, updated) => {
    setItems((prev) => prev.map((it, i) => (i === index ? updated : it)));
  }, []);
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
  const discNum = Number(discount) || 0;
  const chargesNum = Number(additionalCharges) || 0;
  const grandTotal = Math.max(subtotal - discNum + chargesNum, 0);
  const previousBalance = selectedShop?.currentBalance ?? 0;
  const paidNum = Number(amountPaid) || 0;
  const newBalance = previousBalance + grandTotal - paidNum;

  const validate = () => {
    if (!shopId) { toast.error('Please select a shop'); return false; }
    const validItems = items.filter((it) => it.productName.trim());
    if (validItems.length === 0) { toast.error('Add at least one product'); return false; }
    for (const it of validItems) {
      if (!(Number(it.quantity) > 0)) { toast.error(`Quantity for "${it.productName}" must be greater than 0`); return false; }
      if (!(Number(it.rate) >= 0)) { toast.error(`Rate for "${it.productName}" cannot be negative`); return false; }
    }
    return true;
  };

  const buildPayload = () => ({
    shopId,
    items: items.filter((it) => it.productName.trim()).map((it) => ({
      productId: it.productId, productName: it.productName, quantity: Number(it.quantity), unit: it.unit, rate: Number(it.rate),
    })),
    discount: discNum,
    additionalCharges: chargesNum,
    amountPaid: paidNum,
    date,
    notes,
  });

  const handleSave = async (andPrint = false) => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await entryService.updateEntry(id, buildPayload());
        toast.success('Entry updated successfully');
        navigate(`/entries/${id}`);
      } else {
        const result = await entryService.createEntry(buildPayload());
        toast.success('Entry saved successfully');
        if (andPrint && result.receipt) {
          navigate(`/receipts/${result.receipt._id}`);
        } else {
          navigate(`/entries/${result.entry._id}`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Unable to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <Card>
        <CardHeading>{isEdit ? 'Edit Entry' : 'New Daily Entry'}</CardHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Select Shop"
            required
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            placeholder="Choose a shop"
            options={shops.map((s) => ({ value: s._id, label: s.name }))}
            disabled={isEdit}
          />
          <Input label="Entry Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {selectedShop && (
          <div className="mt-3 bg-lightgreen rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="font-medium text-text-main">{selectedShop.name}</span>
            <span className="text-text-secondary">
              Current balance: <CurrencyDisplay value={selectedShop.currentBalance} tone={selectedShop.currentBalance > 0 ? 'error' : undefined} />
            </span>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <CardHeading className="mb-0">Items</CardHeading>
        </div>
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-text-muted pb-2 border-b border-border">
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Quantity</div>
          <div className="col-span-2">Unit</div>
          <div className="col-span-2">Rate</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1"></div>
        </div>
        {items.map((item, index) => (
          <ProductEntryRow
            key={index}
            item={item}
            index={index}
            products={products}
            onChange={updateItem}
            onRemove={removeItem}
            canRemove={items.length > 1}
          />
        ))}
        <button type="button" onClick={addItem} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </Card>

      <Card>
        <CardHeading>Entry Summary</CardHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Input label="Discount (₹)" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          <Input label="Additional Charges (₹)" type="number" min="0" step="0.01" value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} placeholder="0" />
          <Input label="Amount Paid Now (₹)" type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label-field">Notes</label>
          <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>

        <div className="bg-page rounded-lg px-4 py-3.5 space-y-1.5 text-sm mt-4">
          <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span className="text-text-main font-medium">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Previous Balance</span><span className="text-text-main font-medium">{formatCurrency(previousBalance)}</span></div>
          {discNum > 0 && <div className="flex justify-between"><span className="text-text-secondary">Discount</span><span className="text-success font-medium">- {formatCurrency(discNum)}</span></div>}
          {chargesNum > 0 && <div className="flex justify-between"><span className="text-text-secondary">Additional Charges</span><span className="text-text-main font-medium">+ {formatCurrency(chargesNum)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-border"><span className="font-medium text-text-main">Grand Total</span><span className="font-semibold text-text-main">{formatCurrency(grandTotal)}</span></div>
          {paidNum > 0 && <div className="flex justify-between"><span className="text-text-secondary">Amount Paid Now</span><span className="text-success font-medium">- {formatCurrency(paidNum)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-border">
            <span className="font-semibold text-text-main">New Balance</span>
            <span className={`text-[18px] font-semibold ${newBalance > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(newBalance)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>Cancel</Button>
          <Button variant="secondary" icon={Save} onClick={() => handleSave(false)} loading={submitting}>Save Entry</Button>
          {!isEdit && (
            <Button icon={Printer} onClick={() => handleSave(true)} loading={submitting}>Save & Print Receipt</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
