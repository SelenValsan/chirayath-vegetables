import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import CurrencyDisplay from './CurrencyDisplay';
import { formatCurrency } from '../utils/currency';

export default function PaymentForm({ shop, initialData, onSubmit, onCancel, loading, submitLabel = 'Record Payment' }) {
  const [form, setForm] = useState({
    amount: initialData?.amount ?? '',
    direction: initialData?.direction || 'received',
    paymentMethod: initialData?.paymentMethod || 'Cash',
    paymentDate: initialData?.paymentDate ? initialData.paymentDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    referenceNumber: initialData?.referenceNumber || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const amountNum = Number(form.amount) || 0;
  const balanceBefore = shop?.currentBalance ?? 0;
  const isPaid = form.direction === 'paid';
  // Received reduces what the shop owes; Paid (refund/advance to the shop) increases it.
  const remaining = Math.round((balanceBefore + (isPaid ? amountNum : -amountNum)) * 100) / 100;

  const validate = () => {
    const errs = {};
    if (!(amountNum > 0)) errs.amount = 'Amount must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, amount: amountNum, shopId: shop._id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {shop && (
        <div className="bg-lightgreen rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Current Outstanding</span>
          <CurrencyDisplay value={balanceBefore} tone={balanceBefore > 0 ? 'error' : undefined} />
        </div>
      )}

      <div>
        <label className="label-field">Direction</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, direction: 'received' }))}
            className={`flex items-center gap-2 justify-center px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              !isPaid ? 'border-primary bg-lightgreen text-primary' : 'border-border text-text-secondary hover:bg-page'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Cash Received
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, direction: 'paid' }))}
            className={`flex items-center gap-2 justify-center px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              isPaid ? 'border-error bg-error-bg text-error' : 'border-border text-text-secondary hover:bg-page'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Cash Paid
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1.5">
          {isPaid
            ? 'Money going out to the shop (refund, advance, correction) — increases what they owe.'
            : 'Money coming in from the shop — reduces what they owe.'}
        </p>
      </div>

      <Input
        label={isPaid ? 'Amount Paid (₹)' : 'Amount Received (₹)'}
        type="number"
        min="0.01"
        step="0.01"
        required
        value={form.amount}
        onChange={set('amount')}
        error={errors.amount}
        placeholder="0"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Payment Method"
          value={form.paymentMethod}
          onChange={set('paymentMethod')}
          options={['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((o) => ({ value: o, label: o }))}
        />
        <Input label="Payment Date" type="date" value={form.paymentDate} onChange={set('paymentDate')} />
      </div>

      <Input label="Reference Number" value={form.referenceNumber} onChange={set('referenceNumber')} placeholder="Optional (UPI ref, cheque no.)" />

      <div>
        <label className="label-field">Notes</label>
        <textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional" />
      </div>

      <div className="bg-page rounded-lg px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Balance Before</span>
          <span className="text-text-main font-medium">{formatCurrency(balanceBefore)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">{isPaid ? 'Cash Paid' : 'Payment Received'}</span>
          <span className={`font-medium ${isPaid ? 'text-error' : 'text-success'}`}>
            {isPaid ? '+' : '-'} {formatCurrency(amountNum)}
          </span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-border">
          <span className="text-text-secondary font-medium">Remaining Balance</span>
          <span className={`font-semibold ${remaining > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(remaining)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}
