import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Wallet, Pencil, Printer, Phone, MapPin, Loader2 } from 'lucide-react';
import * as shopService from '../services/shopService';
import * as paymentService from '../services/paymentService';
import { Card, CardHeading } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ShopForm from '../components/ShopForm';
import PaymentForm from '../components/PaymentForm';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([shopService.getShop(id), shopService.getShopLedger(id)])
      .then(([shopRes, ledgerRes]) => {
        setShop(shopRes.shop);
        setSummary(shopRes.summary);
        setLedger(ledgerRes);
      })
      .catch((err) => toast.error(err.message || 'Failed to load shop'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await shopService.updateShop(id, payload);
      toast.success('Shop updated successfully');
      setEditOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Unable to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (payload) => {
    setSubmitting(true);
    try {
      await paymentService.createPayment(payload);
      toast.success('Payment recorded successfully');
      setPaymentOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Unable to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/shops')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
        <ArrowLeft className="w-4 h-4" /> Back to Shops
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[24px] font-semibold text-text-main">{shop.name}</h2>
            <Badge status={shop.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
            {shop.ownerName && <span>{shop.ownerName}</span>}
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {shop.phone}</span>
            {shop.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {shop.address}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit Shop</Button>
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print Statement</Button>
          <Button variant="secondary" icon={Wallet} onClick={() => setPaymentOpen(true)}>Record Payment</Button>
          <Button icon={Plus} onClick={() => navigate(`/entries/new?shopId=${id}`)}>Add Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Purchases</p>
          <p className="text-[22px] font-semibold text-text-main mt-1">{formatCurrency(summary?.totalPurchases)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Paid</p>
          <p className="text-[22px] font-semibold text-success mt-1">{formatCurrency(summary?.totalPaid)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Current Balance</p>
          <p className={`text-[22px] font-semibold mt-1 ${shop.currentBalance > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(shop.currentBalance)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Last Payment</p>
          <p className="text-[22px] font-semibold text-text-main mt-1">{formatDate(summary?.lastPaymentDate)}</p>
        </Card>
      </div>

      <Card>
        <CardHeading>Shop Ledger</CardHeading>
        {ledger.length === 0 ? (
          <EmptyState title="No ledger activity yet" description="This shop's transaction history will appear here once entries or payments are recorded." />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm" style={{ minWidth: '640px' }}>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-text-secondary py-3 px-3">Date</th>
                  <th className="text-left font-medium text-text-secondary py-3 px-3">Description</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Debit</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Credit</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((row) => {
                  const isClickable = row.referenceType === 'Entry' && row.referenceId;
                  return (
                    <tr
                      key={row._id}
                      onClick={isClickable ? () => navigate(`/entries/${row.referenceId}`) : undefined}
                      className={isClickable ? 'cursor-pointer hover:bg-page transition-colors' : ''}
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-text-secondary">{formatDate(row.date)}</td>
                      <td className="py-3 px-3 text-text-main">
                        {row.description}
                        <span className="text-xs text-text-muted ml-1.5 capitalize">({row.type.replace('_', ' ')})</span>
                      </td>
                      <td className="py-3 px-3 text-right text-error font-medium">{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                      <td className="py-3 px-3 text-right text-success font-medium">{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                      <td className="py-3 px-3 text-right font-semibold text-text-main">{formatCurrency(row.balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Shop" size="lg">
        <ShopForm initialData={shop} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} submitLabel="Save Changes" loading={submitting} isEdit />
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment">
        <PaymentForm shop={shop} onSubmit={handlePayment} onCancel={() => setPaymentOpen(false)} loading={submitting} />
      </Modal>

      {/* Printable statement - hidden on screen, shown only via @media print in index.css */}
      <div id="receipt-print-area" className="hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold">Chirayath Vegetables</h2>
            <p className="text-xs text-text-muted">Dine with Nature</p>
          </div>
          <div className="flex justify-between text-sm mb-4 pb-4 border-b border-dashed border-border">
            <div>
              <p className="text-text-muted text-xs">Statement For</p>
              <p className="font-medium">{shop.name}</p>
              {shop.ownerName && <p className="text-xs text-text-muted">{shop.ownerName}</p>}
              <p className="text-xs text-text-muted">{shop.phone}</p>
              {shop.address && <p className="text-xs text-text-muted">{shop.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-text-muted text-xs">Statement Date</p>
              <p className="font-medium">{formatDate(new Date())}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm mb-6">
            <div>
              <p className="text-text-muted text-xs">Total Purchases</p>
              <p className="font-semibold">{formatCurrency(summary?.totalPurchases)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Total Paid</p>
              <p className="font-semibold">{formatCurrency(summary?.totalPaid)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Current Balance</p>
              <p className="font-semibold">{formatCurrency(shop.currentBalance)}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="text-left py-1.5">Date</th>
                <th className="text-left py-1.5">Description</th>
                <th className="text-right py-1.5">Debit</th>
                <th className="text-right py-1.5">Credit</th>
                <th className="text-right py-1.5">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row._id} className="border-b border-border/50">
                  <td className="py-1.5">{formatDate(row.date)}</td>
                  <td className="py-1.5">{row.description}</td>
                  <td className="py-1.5 text-right">{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                  <td className="py-1.5 text-right">{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                  <td className="py-1.5 text-right font-medium">{formatCurrency(row.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-center text-xs text-text-muted mt-6 pt-4 border-t border-dashed border-border">
            Thank you for your business.
          </p>
        </div>
      </div>
    </div>
  );
}
