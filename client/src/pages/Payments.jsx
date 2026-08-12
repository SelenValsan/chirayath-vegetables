import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Wallet, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import * as paymentService from '../services/paymentService';
import * as shopService from '../services/shopService';
import { Card } from '../components/Card';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentForm from '../components/PaymentForm';
import Table, { TableRow, TableCell } from '../components/Table';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/date';

const METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Other', label: 'Other' },
];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);

  const [recordOpen, setRecordOpen] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedShopForRecord, setSelectedShopForRecord] = useState(null);
  const [recordShopId, setRecordShopId] = useState('');

  useEffect(() => {
    shopService.getShops({ limit: 100 }).then(({ data }) => setShops(data)).catch(() => {});
  }, []);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    paymentService
      .getPayments({ shopId: shopId || undefined, method: method || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => { setPayments(data); setMeta(m); })
      .catch((err) => toast.error(err.message || 'Failed to load payments'))
      .finally(() => setLoading(false));
  }, [shopId, method, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [shopId, method]);

  useEffect(() => {
    if (!recordShopId) { setSelectedShopForRecord(null); return; }
    shopService.getShop(recordShopId).then((res) => setSelectedShopForRecord(res.shop)).catch(() => {});
  }, [recordShopId]);

  const handleRecord = async (payload) => {
    setSubmitting(true);
    try {
      await paymentService.createPayment(payload);
      toast.success('Payment recorded successfully');
      setRecordOpen(false);
      setRecordShopId('');
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'Unable to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await paymentService.updatePayment(editPayment._id, payload);
      toast.success('Payment updated successfully');
      setEditPayment(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'Unable to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await paymentService.deletePayment(deletePayment._id);
      toast.success('Payment voided and shop balance updated');
      setDeletePayment(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.message || 'Unable to delete payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Select value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="All shops" options={shops.map((s) => ({ value: s._id, label: s.name }))} className="sm:w-56" />
          <Select value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS} className="sm:w-48" />
        </div>
        <Button icon={Plus} onClick={() => setRecordOpen(true)} className="flex-shrink-0">Record Payment</Button>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments yet" description="Payments will appear here once you record one for a shop." actionLabel="Record Payment" onAction={() => setRecordOpen(true)} />
        ) : (
          <>
            <Table columns={[
              { key: 'date', label: 'Date' },
              { key: 'shop', label: 'Shop' },
              { key: 'amount', label: 'Amount' },
              { key: 'method', label: 'Method' },
              { key: 'ref', label: 'Reference' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '' },
            ]}>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="text-text-secondary">{formatDate(p.paymentDate)}</TableCell>
                  <TableCell className="font-medium">{p.shopId?.name || '—'}</TableCell>
                  <TableCell><CurrencyDisplay value={p.amount} tone="success" /></TableCell>
                  <TableCell className="text-text-secondary">{p.paymentMethod}</TableCell>
                  <TableCell className="text-text-secondary">{p.referenceNumber || '—'}</TableCell>
                  <TableCell><Badge status={p.status === 'voided' ? 'voided' : 'active'} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {p.status !== 'voided' && (
                      <div className="relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === p._id ? null : p._id)} className="p-1.5 rounded-lg hover:bg-page text-text-secondary" aria-label="Actions">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === p._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-xl py-1 z-20 w-36">
                            <button onClick={() => { setMenuOpenId(null); setEditPayment(p); }} className="w-full text-left px-3 py-2 text-sm hover:bg-page flex items-center gap-2">
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { setMenuOpenId(null); setDeletePayment(p); }} className="w-full text-left px-3 py-2 text-sm hover:bg-error-bg text-error flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={recordOpen} onClose={() => { setRecordOpen(false); setRecordShopId(''); }} title="Record Payment">
        <Select
          label="Select Shop"
          required
          value={recordShopId}
          onChange={(e) => setRecordShopId(e.target.value)}
          placeholder="Choose a shop"
          options={shops.map((s) => ({ value: s._id, label: s.name }))}
          className="mb-4"
        />
        {selectedShopForRecord && (
          <PaymentForm shop={selectedShopForRecord} onSubmit={handleRecord} onCancel={() => { setRecordOpen(false); setRecordShopId(''); }} loading={submitting} />
        )}
      </Modal>

      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Edit Payment">
        <PaymentForm initialData={editPayment} shop={editPayment?.shopId} onSubmit={handleEdit} onCancel={() => setEditPayment(null)} loading={submitting} submitLabel="Save Changes" />
      </Modal>

      <ConfirmationModal
        open={!!deletePayment}
        onClose={() => setDeletePayment(null)}
        onConfirm={handleDelete}
        title="Delete this payment?"
        message="Deleting this payment will reverse its effect on the shop's balance and update the ledger accordingly."
        confirmLabel="Delete Payment"
        loading={submitting}
      />
    </div>
  );
}
