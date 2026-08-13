import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Store, MoreVertical, Eye, Pencil, Trash2, Archive, ShieldAlert } from 'lucide-react';
import * as shopService from '../services/shopService';
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
  { value: 'pending', label: 'Pending Balance' },
  { value: 'overdue', label: 'Overdue' },
];

const SORT_OPTIONS = [
  { value: '-updatedAt', label: 'Latest Activity' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-name', label: 'Name (Z-A)' },
  { value: '-currentBalance', label: 'Balance (High to Low)' },
  { value: 'currentBalance', label: 'Balance (Low to High)' },
];

export default function Shops() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState('-updatedAt');
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const [deleteShop, setDeleteShop] = useState(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchShops = useCallback(() => {
    setLoading(true);
    shopService
      .getShops({ search: search || undefined, status, sort, page, limit: 12 })
      .then(({ data, meta: m }) => {
        setShops(data);
        setMeta(m);
      })
      .catch((err) => toast.error(err.message || 'Failed to load shops'))
      .finally(() => setLoading(false));
  }, [search, status, sort, page]);

  useEffect(() => { fetchShops(); }, [fetchShops]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleAdd = async (payload) => {
    setSubmitting(true);
    try {
      await shopService.createShop(payload);
      toast.success('Shop added successfully');
      setAddOpen(false);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Unable to add shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (payload) => {
    setSubmitting(true);
    try {
      await shopService.updateShop(editShop._id, payload);
      toast.success('Shop updated successfully');
      setEditShop(null);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Unable to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await shopService.deleteShop(deleteShop._id);
      toast.success(res.message || 'Shop removed');
      setDeleteShop(null);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Unable to delete shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermanentDelete = async () => {
    setSubmitting(true);
    try {
      await shopService.permanentDeleteShop(permanentDeleteTarget._id, permanentDeleteTarget.name);
      toast.success(`${permanentDeleteTarget.name} and all related records were permanently deleted`);
      setPermanentDeleteTarget(null);
      fetchShops();
    } catch (err) {
      toast.error(err.message || 'Unable to permanently delete shop');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search shops..." className="sm:max-w-xs" />
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSearchParams(e.target.value === 'all' ? {} : { status: e.target.value }); }}
            options={FILTERS}
            className="sm:w-48"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={SORT_OPTIONS}
            className="sm:w-52"
          />
        </div>
        <Button icon={Plus} onClick={() => setAddOpen(true)} className="flex-shrink-0">Add Shop</Button>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : shops.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No shops yet"
            description="Add your first shop to start recording daily entries."
            actionLabel="Add Shop"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <>
            <Table
              columns={[
                { key: 'name', label: 'Shop Name' },
                { key: 'owner', label: 'Owner' },
                { key: 'phone', label: 'Phone' },
                { key: 'last', label: 'Last Entry' },
                { key: 'balance', label: 'Current Balance' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: '' },
              ]}
            >
              {shops.map((shop) => (
                <TableRow key={shop._id} onClick={() => navigate(`/shops/${shop._id}`)}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell className="text-text-secondary">{shop.ownerName || '—'}</TableCell>
                  <TableCell className="text-text-secondary">{shop.phone}</TableCell>
                  <TableCell className="text-text-secondary">{formatDate(shop.updatedAt)}</TableCell>
                  <TableCell><CurrencyDisplay value={shop.currentBalance} tone={shop.currentBalance > 0 ? 'error' : undefined} /></TableCell>
                  <TableCell><Badge status={shop.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === shop._id ? null : shop._id)}
                        className="p-1.5 rounded-lg hover:bg-page text-text-secondary"
                        aria-label="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === shop._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-xl py-1 z-20 w-40">
                          <button onClick={() => { setMenuOpenId(null); navigate(`/shops/${shop._id}`); }} className="w-full text-left px-3 py-2 text-sm hover:bg-page flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setEditShop(shop); }} className="w-full text-left px-3 py-2 text-sm hover:bg-page flex items-center gap-2">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setDeleteShop(shop); }} className="w-full text-left px-3 py-2 text-sm hover:bg-error-bg text-error flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                          <button onClick={() => { setMenuOpenId(null); setPermanentDeleteTarget(shop); }} className="w-full text-left px-3 py-2 text-sm hover:bg-error-bg text-error flex items-center gap-2 border-t border-border">
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Shop" size="lg">
        <ShopForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} submitLabel="Add Shop" loading={submitting} />
      </Modal>

      <Modal open={!!editShop} onClose={() => setEditShop(null)} title="Edit Shop" size="lg">
        <ShopForm initialData={editShop} onSubmit={handleEdit} onCancel={() => setEditShop(null)} submitLabel="Save Changes" loading={submitting} isEdit />
      </Modal>

      <ConfirmationModal
        open={!!deleteShop}
        onClose={() => setDeleteShop(null)}
        onConfirm={handleDelete}
        title="Delete this shop?"
        message={
          <>
            Deleting <strong>{deleteShop?.name}</strong> may also affect related transactions and ledger information.
            {' '}Shops with existing financial history will be archived instead of permanently deleted.
          </>
        }
        confirmLabel="Delete Shop"
        loading={submitting}
      />

      <TypeToConfirmModal
        open={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently delete this shop?"
        message={
          <>
            This will permanently and irreversibly delete <strong>{permanentDeleteTarget?.name}</strong> along
            with every entry, payment, ledger transaction, and receipt tied to it. This cannot be undone — use this
            only for cleaning up test/demo data, not real shops with genuine business history.
          </>
        }
        confirmWord={permanentDeleteTarget?.name}
        confirmLabel="Delete Permanently"
        loading={submitting}
      />
    </div>
  );
}
