import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Truck, MoreVertical, Eye, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import * as supplierService from '../services/supplierService';
import { Card } from '../components/Card';
import SearchInput from '../components/SearchInput';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import TypeToConfirmModal from '../components/TypeToConfirmModal';
import ShopForm from '../components/ShopForm';
import Table, { TableRow, TableCell } from '../components/Table';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/date';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Amount Payable' },
];

const SORT_OPTIONS = [
  { value: '-updatedAt', label: 'Latest Activity' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-name', label: 'Name (Z-A)' },
  { value: '-payableBalance', label: 'Payable (High to Low)' },
  { value: 'payableBalance', label: 'Payable (Low to High)' },
];

export default function Suppliers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState('-updatedAt');
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(() => {
    setLoading(true);
    supplierService
      .getSuppliers({ search: search || undefined, status, sort, page, limit: 12 })
      .then(({ data, meta: m }) => { setSuppliers(data); setMeta(m); })
      .catch((err) => toast.error(err.message || 'Failed to load suppliers'))
      .finally(() => setLoading(false));
  }, [search, status, sort, page]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);
  useEffect(() => { setPage(1); }, [search, status, sort]);

  const handleAdd = async (payload) => {
    setSubmitting(true);
    try {
      await supplierService.createSupplier(payload);
      toast.success('Supplier added successfully');
      setAddOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Unable to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await supplierService.updateSupplier(editSupplier._id, payload);
      toast.success('Supplier updated successfully');
      setEditSupplier(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Unable to update supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await supplierService.deleteSupplier(deleteSupplierTarget._id);
      toast.success(res.message || 'Supplier removed');
      setDeleteSupplierTarget(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Unable to remove supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermanentDelete = async () => {
    setSubmitting(true);
    try {
      const res = await supplierService.permanentDeleteSupplier(permanentDeleteTarget._id, permanentDeleteTarget.name);
      toast.success(res.message || 'Supplier permanently deleted');
      setPermanentDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Unable to permanently delete supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." className="sm:max-w-xs" />
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSearchParams(e.target.value === 'all' ? {} : { status: e.target.value }); }}
            options={FILTERS}
            className="sm:w-48"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} className="sm:w-52" />
        </div>
        <Button icon={Plus} onClick={() => setAddOpen(true)} className="flex-shrink-0">Add Supplier</Button>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers yet"
            description="Add wholesalers or farmers you buy vegetables from to start tracking purchases."
            actionLabel="Add Supplier"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <>
            <Table columns={[
              { key: 'name', label: 'Supplier Name' },
              { key: 'contact', label: 'Contact' },
              { key: 'phone', label: 'Phone' },
              { key: 'last', label: 'Last Activity' },
              { key: 'payable', label: 'Amount Payable' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '' },
            ]}>
              {suppliers.map((s) => (
                <TableRow key={s._id} onClick={() => navigate(`/suppliers/${s._id}`)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-text-secondary">{s.ownerName || '—'}</TableCell>
                  <TableCell className="text-text-secondary">{s.phone}</TableCell>
                  <TableCell className="text-text-secondary">{formatDate(s.updatedAt)}</TableCell>
                  <TableCell><CurrencyDisplay value={s.payableBalance} tone={s.payableBalance > 0 ? 'error' : undefined} /></TableCell>
                  <TableCell><Badge status={s.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === s._id ? null : s._id)}
                        className="p-1.5 rounded-lg hover:bg-page text-text-secondary"
                        aria-label="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === s._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-xl py-1 z-20 w-44">
                          <button onClick={() => { setMenuOpenId(null); navigate(`/suppliers/${s._id}`); }} className="w-full text-left px-3 py-2 text-sm hover:bg-page flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setEditSupplier(s); }} className="w-full text-left px-3 py-2 text-sm hover:bg-page flex items-center gap-2">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setDeleteSupplierTarget(s); }} className="w-full text-left px-3 py-2 text-sm hover:bg-error-bg text-error flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Remove Supplier Role
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setPermanentDeleteTarget(s); }} className="w-full text-left px-3 py-2 text-sm hover:bg-error-bg text-error flex items-center gap-2 border-t border-border">
                            <ShieldAlert className="w-3.5 h-3.5" /> Delete Permanently
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Supplier" size="lg">
        <ShopForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Supplier" loading={submitting} defaultPartyType="supplier" />
      </Modal>

      <Modal open={!!editSupplier} onClose={() => setEditSupplier(null)} title="Edit Supplier" size="lg">
        <ShopForm initialData={editSupplier} onSubmit={handleEdit} onCancel={() => setEditSupplier(null)} submitLabel="Save Changes" loading={submitting} isEdit defaultPartyType="supplier" />
      </Modal>

      <ConfirmationModal
        open={!!deleteSupplierTarget}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={handleDelete}
        title="Remove supplier role?"
        message={
          <>
            If <strong>{deleteSupplierTarget?.name}</strong> is also a customer, it stays fully intact and just stops being
            listed as a supplier. If it's a supplier only, it will be archived (not deleted) since it has purchase history.
          </>
        }
        confirmLabel="Remove Supplier Role"
        loading={submitting}
      />

      <TypeToConfirmModal
        open={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently delete this supplier?"
        message={
          <>
            This permanently deletes every purchase and payment record for <strong>{permanentDeleteTarget?.name}</strong>.
            If this business also has customer history, it will be kept as a customer with that history untouched —
            only the supplier-side data is removed.
          </>
        }
        confirmWord={permanentDeleteTarget?.name}
        confirmLabel="Delete Permanently"
        loading={submitting}
      />
    </div>
  );
}
