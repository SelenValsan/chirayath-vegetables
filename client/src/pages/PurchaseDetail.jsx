import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import * as purchaseService from '../services/purchaseService';
import { Card, CardHeading } from '../components/Card';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import Badge from '../components/Badge';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPurchase = useCallback(() => {
    setLoading(true);
    purchaseService.getPurchase(id).then(setPurchase).catch((err) => toast.error(err.message || 'Failed to load purchase')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchPurchase(); }, [fetchPurchase]);

  const handleVoid = async () => {
    setSubmitting(true);
    try {
      await purchaseService.deletePurchase(id);
      toast.success('Purchase voided and payable balance updated');
      setDeleteOpen(false);
      fetchPurchase();
    } catch (err) {
      toast.error(err.message || 'Unable to void purchase');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!purchase) return null;

  const isVoided = purchase.status === 'voided';

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate('/suppliers')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
        <ArrowLeft className="w-4 h-4" /> Back to Suppliers
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-text-main">{purchase.shopId?.name}</h2>
            <Badge status={isVoided ? 'voided' : 'active'} />
          </div>
          <p className="text-sm text-text-muted mt-0.5">{formatDate(purchase.date)}</p>
        </div>
        {!isVoided && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/purchases/${id}/edit`)}>Edit</Button>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>Delete</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeading>Items</CardHeading>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm" style={{ minWidth: '520px' }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-text-secondary py-2.5 px-3">Product</th>
                <th className="text-right font-medium text-text-secondary py-2.5 px-3">Qty</th>
                <th className="text-right font-medium text-text-secondary py-2.5 px-3">Rate</th>
                <th className="text-right font-medium text-text-secondary py-2.5 px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchase.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 text-text-main">{item.productName}</td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">{item.quantity} {item.unit}</td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">{formatCurrency(item.rate)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-text-main">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeading>Summary</CardHeading>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span className="text-text-main font-medium">{formatCurrency(purchase.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Previous Payable</span><span className="text-text-main font-medium">{formatCurrency(purchase.previousBalance)}</span></div>
          {purchase.discount > 0 && <div className="flex justify-between"><span className="text-text-secondary">Discount</span><span className="text-success font-medium">- {formatCurrency(purchase.discount)}</span></div>}
          {purchase.additionalCharges > 0 && <div className="flex justify-between"><span className="text-text-secondary">Additional Charges</span><span className="text-text-main font-medium">+ {formatCurrency(purchase.additionalCharges)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-border"><span className="font-medium text-text-main">Grand Total</span><span className="font-semibold text-text-main">{formatCurrency(purchase.total)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Amount Paid</span><span className="text-success font-medium">{formatCurrency(purchase.amountPaid)}</span></div>
          <div className="flex justify-between pt-1.5 border-t border-border">
            <span className="font-semibold text-text-main">Remaining Payable</span>
            <span className={`text-[18px] font-semibold ${purchase.remainingBalance > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(purchase.remainingBalance)}</span>
          </div>
        </div>
        {purchase.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-secondary">{purchase.notes}</p>
          </div>
        )}
      </Card>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleVoid}
        title="Delete this purchase?"
        message="Deleting this purchase will reverse its financial effect and update the supplier's payable balance and ledger. The purchase will be voided, not permanently erased, to preserve your records."
        confirmLabel="Delete Purchase"
        loading={submitting}
      />
    </div>
  );
}
