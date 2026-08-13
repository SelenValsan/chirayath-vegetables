import React, { useState, useEffect } from 'react';
import Input from './Input';
import Select from './Select';
import Button from './Button';

const emptyForm = {
  name: '', ownerName: '', phone: '', alternatePhone: '', email: '',
  address: '', location: '', openingBalance: '', paymentPreference: 'Cash', notes: '', status: 'active',
};

export default function ShopForm({ initialData, onSubmit, onCancel, submitLabel = 'Add Shop', loading, isEdit = false }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        ownerName: initialData.ownerName || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        location: initialData.location || '',
        openingBalance: initialData.openingBalance ?? '',
        paymentPreference: initialData.paymentPreference || 'Cash',
        notes: initialData.notes || '',
        status: initialData.status || 'active',
      });
    }
  }, [initialData]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Shop name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form, openingBalance: Number(form.openingBalance) || 0 };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Shop Name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Green Mart" />
        <Input label="Owner / Contact Person" value={form.ownerName} onChange={set('ownerName')} placeholder="e.g. Rajesh Nair" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone Number" required value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="9876543210" />
        <Input label="Alternative Phone" value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="Optional" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="Optional" />
        <Select
          label="Payment Preference"
          value={form.paymentPreference}
          onChange={set('paymentPreference')}
          options={['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'].map((o) => ({ value: o, label: o }))}
        />
      </div>
      <Input label="Address" value={form.address} onChange={set('address')} placeholder="Optional" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Location / Area" value={form.location} onChange={set('location')} placeholder="Optional" />
        <Input
          label="Opening Balance (₹)"
          type="number"
          step="0.01"
          value={form.openingBalance}
          onChange={set('openingBalance')}
          placeholder="0"
        />
      </div>
      {isEdit && (
        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'overdue', label: 'Overdue' },
          ]}
        />
      )}
      <div>
        <label className="label-field">Notes</label>
        <textarea className="input-field" rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}
