import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Printer, Loader2 } from 'lucide-react';
import * as entryService from '../services/entryService';
import { Card, CardHeading } from '../components/Card';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import Badge from '../components/Badge';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntry = useCallback(() => {
    setLoading(true);
    entryService.getEntry(id).then(setEntry).catch((err) => toast.error(err.message || 'Failed to load entry')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  const handleVoid = async () => {
    setSubmitting(true);
    try {
      await entryService.deleteEntry(id);
      toast.success('Entry voided and shop balance updated');
      setDeleteOpen(false);
      fetchEntry();
    } catch (err) {
      toast.error(err.message || 'Unable to void entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  if (!entry) return null;

  const isVoided = entry.status === 'voided';

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate('/entries')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
        <ArrowLeft className="w-4 h-4" /> Back to Entries
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-semibold text-text-main">{entry.shopId?.name}</h2>
            <Badge status={isVoided ? 'voided' : 'active'} />
          </div>
          <p className="text-sm text-text-muted mt-0.5">{formatDate(entry.date)}</p>
        </div>
        {!isVoided && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
            <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/entries/${id}/edit`)}>Edit</Button>
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
              {entry.items.map((item, i) => (
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
          <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span className="text-text-main font-medium">{formatCurrency(entry.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Previous Balance</span><span className="text-text-main font-medium">{formatCurrency(entry.previousBalance)}</span></div>
          {entry.discount > 0 && <div className="flex justify-between"><span className="text-text-secondary">Discount</span><span className="text-success font-medium">- {formatCurrency(entry.discount)}</span></div>}
          {entry.additionalCharges > 0 && <div className="flex justify-between"><span className="text-text-secondary">Additional Charges</span><span className="text-text-main font-medium">+ {formatCurrency(entry.additionalCharges)}</span></div>}
          <div className="flex justify-between pt-1.5 border-t border-border"><span className="font-medium text-text-main">Grand Total</span><span className="font-semibold text-text-main">{formatCurrency(entry.total)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Amount Paid</span><span className="text-success font-medium">{formatCurrency(entry.amountPaid)}</span></div>
          <div className="flex justify-between pt-1.5 border-t border-border">
            <span className="font-semibold text-text-main">Remaining Balance</span>
            <span className={`text-[18px] font-semibold ${entry.remainingBalance > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(entry.remainingBalance)}</span>
          </div>
        </div>
        {entry.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-secondary">{entry.notes}</p>
          </div>
        )}
      </Card>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleVoid}
        title="Delete this entry?"
        message="Deleting this entry will reverse its financial effect and update the shop's balance and ledger. The entry will be voided, not permanently erased, to preserve your records."
        confirmLabel="Delete Entry"
        loading={submitting}
      />
    </div>
  );
}
