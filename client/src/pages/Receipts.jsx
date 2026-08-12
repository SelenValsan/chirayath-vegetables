import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt as ReceiptIcon } from 'lucide-react';
import * as receiptService from '../services/receiptService';
import * as shopService from '../services/shopService';
import { Card } from '../components/Card';
import Select from '../components/Select';
import Table, { TableRow, TableCell } from '../components/Table';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/date';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'entry', label: 'Supply Entry' },
  { value: 'payment', label: 'Payment' },
];

export default function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    shopService.getShops({ limit: 100 }).then(({ data }) => setShops(data)).catch(() => {});
  }, []);

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    receiptService
      .getReceipts({ shopId: shopId || undefined, type: type || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => { setReceipts(data); setMeta(m); })
      .catch((err) => toast.error(err.message || 'Failed to load receipts'))
      .finally(() => setLoading(false));
  }, [shopId, type, page]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);
  useEffect(() => { setPage(1); }, [shopId, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="All shops" options={shops.map((s) => ({ value: s._id, label: s.name }))} className="w-56" />
        <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPES} className="w-48" />
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : receipts.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="No receipts yet" description="Receipts are generated automatically whenever you save an entry or record a payment." />
        ) : (
          <>
            <Table columns={[
              { key: 'number', label: 'Receipt No.' },
              { key: 'shop', label: 'Shop' },
              { key: 'type', label: 'Type' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status' },
            ]}>
              {receipts.map((r) => (
                <TableRow key={r._id} onClick={() => navigate(`/receipts/${r._id}`)}>
                  <TableCell className="font-medium">{r.receiptNumber}</TableCell>
                  <TableCell className="text-text-secondary">{r.shopId?.name || '—'}</TableCell>
                  <TableCell className="text-text-secondary capitalize">{r.type === 'entry' ? 'Supply Entry' : 'Payment'}</TableCell>
                  <TableCell className="text-text-secondary">{formatDate(r.createdAt)}</TableCell>
                  <TableCell><Badge status={r.status === 'void' ? 'void' : 'active'} /></TableCell>
                </TableRow>
              ))}
            </Table>
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
