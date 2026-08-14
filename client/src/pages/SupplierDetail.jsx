import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Wallet, Pencil, Phone, MapPin, Loader2, Trash2 } from 'lucide-react';
import * as supplierService from '../services/supplierService';
import * as supplierPaymentService from '../services/supplierPaymentService';
import * as supplierTransactionService from '../services/supplierTransactionService';
import { Card, CardHeading } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import ShopForm from '../components/ShopForm';
import SupplierPaymentForm from '../components/SupplierPaymentForm';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLedgerRow, setDeleteLedgerRow] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([supplierService.getSupplier(id), supplierService.getSupplierLedger(id)])
      .then(([supplierRes, ledgerRes]) => {
        setSupplier(supplierRes.supplier);
        setSummary(supplierRes.summary);
        setLedger(ledgerRes);
      })
      .catch((err) => toast.error(err.message || 'Failed to load supplier'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await supplierService.updateSupplier(id, payload);
      toast.success('Supplier updated successfully');
      setEditOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Unable to update supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (payload) => {
    setSubmitting(true);
    try {
      await supplierPaymentService.createSupplierPayment(payload);
      toast.success('Payment recorded successfully');
      setPaymentOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Unable to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLedgerRow = async () => {
    setSubmitting(true);
    try {
      await supplierTransactionService.deleteSupplierLedgerTransaction(deleteLedgerRow._id);
      toast.success('Ledger entry removed and balance updated');
      setDeleteLedgerRow(null);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Unable to remove this entry');
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

  if (!supplier) return null;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/suppliers')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main">
        <ArrowLeft className="w-4 h-4" /> Back to Suppliers
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[24px] font-semibold text-text-main">{supplier.name}</h2>
            <Badge status={supplier.status} />
            {supplier.partyType === 'both' && <Badge status="info">Also a Customer</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
            {supplier.ownerName && <span>{supplier.ownerName}</span>}
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {supplier.phone}</span>
            {supplier.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {supplier.address}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit Supplier</Button>
          <Button variant="secondary" icon={Wallet} onClick={() => setPaymentOpen(true)}>Record Payment</Button>
          <Button icon={Plus} onClick={() => navigate(`/purchases/new?supplierId=${id}`)}>Add Purchase</Button>
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
          <p className="text-sm text-text-secondary">Amount Payable</p>
          <p className={`text-[22px] font-semibold mt-1 ${supplier.payableBalance > 0 ? 'text-error' : 'text-success'}`}>{formatCurrency(supplier.payableBalance)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Last Payment</p>
          <p className="text-[22px] font-semibold text-text-main mt-1">{formatDate(summary?.lastPaymentDate)}</p>
        </Card>
      </div>

      <Card>
        <CardHeading>Supplier Ledger</CardHeading>
        {ledger.length === 0 ? (
          <EmptyState title="No purchases or payments yet" description="This supplier's purchase and payment history will appear here." />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm" style={{ minWidth: '680px' }}>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-text-secondary py-3 px-3">Date</th>
                  <th className="text-left font-medium text-text-secondary py-3 px-3">Description</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Purchase</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Payment</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3">Balance</th>
                  <th className="text-right font-medium text-text-secondary py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((row) => {
                  const isClickable = row.referenceType === 'PurchaseEntry' && row.referenceId;
                  const isRemovable = ['opening_balance', 'adjustment'].includes(row.type);
                  return (
                    <tr
                      key={row._id}
                      onClick={isClickable ? () => navigate(`/purchases/${row.referenceId}`) : undefined}
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
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isRemovable && (
                          <button
                            onClick={() => setDeleteLedgerRow(row)}
                            aria-label="Remove entry"
                            className="p-1.5 rounded-lg text-error hover:bg-error-bg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Supplier" size="lg">
        <ShopForm initialData={supplier} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} submitLabel="Save Changes" loading={submitting} isEdit defaultPartyType="supplier" />
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment">
        <SupplierPaymentForm supplier={supplier} onSubmit={handlePayment} onCancel={() => setPaymentOpen(false)} loading={submitting} />
      </Modal>

      <ConfirmationModal
        open={!!deleteLedgerRow}
        onClose={() => setDeleteLedgerRow(null)}
        onConfirm={handleDeleteLedgerRow}
        title="Remove this ledger entry?"
        message={
          <>
            This will remove <strong>{deleteLedgerRow?.description}</strong> and recalculate the payable balance.
            Use this only to clean up incorrect or leftover opening balance/adjustment entries.
          </>
        }
        confirmLabel="Remove Entry"
        loading={submitting}
      />
    </div>
  );
}
