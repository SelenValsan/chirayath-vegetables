import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeftRight } from 'lucide-react';
import * as transactionService from '../services/transactionService';
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
  { value: 'sale', label: 'Sale' },
  { value: 'payment', label: 'Payment' },
  { value: 'opening_balance', label: 'Opening Balance' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'refund', label: 'Refund' },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    shopService.getShops({ limit: 100 }).then(({ data }) => setShops(data)).catch(() => {});
  }, []);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    transactionService
      .getTransactions({ shopId: shopId || undefined, type: type || undefined, from: from || undefined, to: to || undefined, page, limit: 25 })
      .then(({ data, meta: m }) => { setTransactions(data); setMeta(m); })
      .catch((err) => toast.error(err.message || 'Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [shopId, type, from, to, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setPage(1); }, [shopId, type, from, to]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="All shops" options={shops.map((s) => ({ value: s._id, label: s.name }))} className="w-56" />
        <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPES} className="w-48" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-40" aria-label="From date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-40" aria-label="To date" />
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : transactions.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" description="Transactions will appear after you create an entry or record a payment." />
        ) : (
          <>
            <Table columns={[
              { key: 'date', label: 'Date' },
              { key: 'shop', label: 'Shop' },
              { key: 'description', label: 'Description' },
              { key: 'debit', label: 'Debit' },
              { key: 'credit', label: 'Credit' },
              { key: 'balance', label: 'Balance' },
              { key: 'type', label: 'Type' },
            ]}>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell className="text-text-secondary">{formatDate(tx.date)}</TableCell>
                  <TableCell className="font-medium">{tx.shopId?.name || '—'}</TableCell>
                  <TableCell className="text-text-secondary">{tx.description}</TableCell>
                  <TableCell className="text-error font-medium">{tx.debit > 0 ? <CurrencyDisplay value={tx.debit} /> : '—'}</TableCell>
                  <TableCell className="text-success font-medium">{tx.credit > 0 ? <CurrencyDisplay value={tx.credit} /> : '—'}</TableCell>
                  <TableCell className="font-semibold"><CurrencyDisplay value={tx.balanceAfter} /></TableCell>
                  <TableCell><Badge status="default">{tx.type.replace('_', ' ')}</Badge></TableCell>
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
