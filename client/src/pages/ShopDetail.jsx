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
                {ledger.map((row) => (
                  <tr key={row._id}>
                    <td className="py-3 px-3 whitespace-nowrap text-text-secondary">{formatDate(row.date)}</td>
                    <td className="py-3 px-3 text-text-main">
                      {row.description}
                      <span className="text-xs text-text-muted ml-1.5 capitalize">({row.type.replace('_', ' ')})</span>
                    </td>
                    <td className="py-3 px-3 text-right text-error font-medium">{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                    <td className="py-3 px-3 text-right text-success font-medium">{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                    <td className="py-3 px-3 text-right font-semibold text-text-main">{formatCurrency(row.balanceAfter)}</td>
                  </tr>
                ))}
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
    </div>
  );
}
