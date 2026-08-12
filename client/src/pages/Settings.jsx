import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, User, Landmark, Receipt, Database, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeading } from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  { key: 'business', label: 'Business Profile', icon: Building2 },
  { key: 'account', label: 'Account', icon: User },
  { key: 'payment', label: 'Payment Details', icon: Landmark },
  { key: 'receipt', label: 'Receipt Configuration', icon: Receipt },
  { key: 'data', label: 'Data Settings', icon: Database },
];

export default function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState('business');
  const [showAccount, setShowAccount] = useState(false);

  const [business, setBusiness] = useState({
    name: 'Chirayath Vegetables',
    tagline: 'Dine with Nature',
    phone: '',
    email: '',
    address: '',
    gst: '',
  });
  const [bank, setBank] = useState({
    accountHolder: '', bankName: '', accountNumber: '', ifsc: '', branch: '', upiId: '', gpayNumber: '',
  });
  const [receiptConfig, setReceiptConfig] = useState({ prefix: 'CV', footer: 'Thank you for your business.' });

  const handleSaveBusiness = (e) => { e.preventDefault(); toast.success('Business profile updated successfully'); };
  const handleSaveBank = (e) => { e.preventDefault(); toast.success('Payment details updated successfully'); };
  const handleSaveReceipt = (e) => { e.preventDefault(); toast.success('Receipt configuration updated successfully'); };

  const maskAccount = (num) => (num ? `••••${num.slice(-4)}` : '');

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <nav className="lg:w-56 flex-shrink-0 flex lg:flex-col gap-1 overflow-x-auto">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap text-left transition-colors ${
              active === key ? 'bg-lightgreen text-primary' : 'text-text-secondary hover:bg-page'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 min-w-0">
        {active === 'business' && (
          <Card>
            <CardHeading>Business Profile</CardHeading>
            <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-lg">
              <Input label="Business Name" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
              <Input label="Tagline" value={business.tagline} onChange={(e) => setBusiness({ ...business, tagline: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="9876543210" />
                <Input label="Email" type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} placeholder="business@example.com" />
              </div>
              <Input label="Address" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
              <Input label="GST Number" value={business.gst} onChange={(e) => setBusiness({ ...business, gst: e.target.value })} placeholder="Optional" />
              <Button type="submit">Save Changes</Button>
            </form>
          </Card>
        )}

        {active === 'account' && (
          <Card>
            <CardHeading>Account</CardHeading>
            <div className="max-w-lg space-y-4">
              <Input label="Name" value={user?.name || ''} disabled />
              <Input label="Email" value={user?.email || ''} disabled />
              <Input label="Role" value={user?.role || ''} disabled className="capitalize" />
              <p className="text-xs text-text-muted">To change your name or email, contact your system administrator.</p>
            </div>
          </Card>
        )}

        {active === 'payment' && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <CardHeading className="mb-0">Payment Details</CardHeading>
              <button onClick={() => setShowAccount((v) => !v)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                {showAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showAccount ? 'Hide' : 'Show'} sensitive details
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="space-y-4 max-w-lg">
              <Input label="Account Holder" value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} />
              <Input label="Bank Name" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
              <Input
                label="Account Number"
                value={showAccount ? bank.accountNumber : maskAccount(bank.accountNumber)}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                readOnly={!showAccount}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="IFSC" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} />
                <Input label="Branch" value={bank.branch} onChange={(e) => setBank({ ...bank, branch: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="UPI ID" value={bank.upiId} onChange={(e) => setBank({ ...bank, upiId: e.target.value })} placeholder="name@bank" />
                <Input label="GPay Number" value={bank.gpayNumber} onChange={(e) => setBank({ ...bank, gpayNumber: e.target.value })} />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </Card>
        )}

        {active === 'receipt' && (
          <Card>
            <CardHeading>Receipt Configuration</CardHeading>
            <form onSubmit={handleSaveReceipt} className="space-y-4 max-w-lg">
              <Input label="Receipt Number Prefix" value={receiptConfig.prefix} onChange={(e) => setReceiptConfig({ ...receiptConfig, prefix: e.target.value })} />
              <p className="text-xs text-text-muted -mt-2">Receipts are numbered automatically, e.g. {receiptConfig.prefix}-2026-00001</p>
              <div>
                <label className="label-field">Receipt Footer Message</label>
                <textarea className="input-field" rows={2} value={receiptConfig.footer} onChange={(e) => setReceiptConfig({ ...receiptConfig, footer: e.target.value })} />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </Card>
        )}

        {active === 'data' && (
          <Card>
            <CardHeading>Data Settings</CardHeading>
            <p className="text-sm text-text-secondary mb-4">
              Financial records (entries, payments, ledger transactions) are never permanently deleted from
              Chirayath Vegetables — they're voided or archived so your books always stay reconcilable.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Soft-delete protection</span>
                <span className="text-success font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Audit trail (created/updated by)</span>
                <span className="text-success font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Receipt numbering</span>
                <span className="text-success font-medium">Automatic, sequential</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
