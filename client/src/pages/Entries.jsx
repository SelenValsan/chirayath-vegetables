import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, ClipboardList } from 'lucide-react';
import * as entryService from '../services/entryService';
import * as shopService from '../services/shopService';
import { Card } from '../components/Card';
import Select from '../components/Select';
import Button from '../components/Button';
import Table, { TableRow, TableCell } from '../components/Table';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/date';

export default function Entries() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    shopService.getShops({ limit: 100 }).then(({ data }) => setShops(data)).catch(() => {});
  }, []);

  const fetchEntries = useCallback(() => {
    setLoading(true);
    entryService
      .getEntries({ shopId: shopId || undefined, status: status || undefined, from: from || undefined, to: to || undefined, page, limit: 15 })
      .then(({ data, meta: m }) => { setEntries(data); setMeta(m); })
      .catch((err) => toast.error(err.message || 'Failed to load entries'))
      .finally(() => setLoading(false));
  }, [shopId, status, from, to, page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [shopId, status, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Select value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="All shops" options={shops.map((s) => ({ value: s._id, label: s.name }))} className="sm:w-56" />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Entries' },
              { value: 'active', label: 'Active' },
              { value: 'voided', label: 'Voided' },
            ]}
            className="sm:w-40"
          />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field sm:w-40" aria-label="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field sm:w-40" aria-label="To date" />
        </div>
        <Button icon={Plus} onClick={() => navigate('/entries/new')} className="flex-shrink-0">New Entry</Button>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : entries.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No entries yet" description="Add your first daily supply entry to start tracking sales." actionLabel="New Entry" onAction={() => navigate('/entries/new')} />
        ) : (
          <>
            <Table columns={[
              { key: 'date', label: 'Date' },
              { key: 'shop', label: 'Shop' },
              { key: 'items', label: 'Items' },
              { key: 'total', label: 'Total' },
              { key: 'paid', label: 'Paid' },
              { key: 'status', label: 'Status' },
            ]}>
              {entries.map((entry) => (
                <TableRow key={entry._id} onClick={() => navigate(`/entries/${entry._id}`)}>
                  <TableCell className="text-text-secondary">{formatDate(entry.date)}</TableCell>
                  <TableCell className="font-medium">{entry.shopId?.name || '—'}</TableCell>
                  <TableCell className="text-text-secondary">{entry.items.length} item{entry.items.length > 1 ? 's' : ''}</TableCell>
                  <TableCell><CurrencyDisplay value={entry.total} /></TableCell>
                  <TableCell className="text-success font-medium">{entry.amountPaid > 0 ? <CurrencyDisplay value={entry.amountPaid} /> : '—'}</TableCell>
                  <TableCell><Badge status={entry.status === 'voided' ? 'voided' : 'active'} /></TableCell>
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
