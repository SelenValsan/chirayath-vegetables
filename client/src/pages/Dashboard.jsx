import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, AlertCircle, Store, Package, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import * as reportService from '../services/reportService';
import StatCard from '../components/StatCard';
import { Card, CardHeading } from '../components/Card';
import Badge from '../components/Badge';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { StatGridSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/date';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then(setData)
      .catch((err) => toast.error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatGridSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={data?.todaySales} icon={TrendingUp} />
        <StatCard label="Payments Received" value={data?.todayPayments} icon={Wallet} tone="success" />
        <StatCard label="Outstanding Balance" value={data?.outstandingBalance} icon={AlertCircle} tone="warning" />
        <StatCard label="Active Shops" value={data?.activeShops} isCurrency={false} icon={Store} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Today's Entries</p>
          <p className="text-2xl font-semibold text-text-main mt-1">{data?.todayEntries ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Quantity Supplied Today</p>
          <p className="text-2xl font-semibold text-text-main mt-1">{Math.round((data?.todayQuantity || 0) * 100) / 100} kg</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Today's Pending Amount</p>
          <p className="text-2xl font-semibold text-warning mt-1">
            <CurrencyDisplay value={data?.todayPending} />
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <CardHeading className="mb-0">Recent Transactions</CardHeading>
            <Link to="/transactions" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data?.recentTransactions?.length ? (
            <div className="divide-y divide-border">
              {data.recentTransactions.map((tx) => (
                <div key={tx._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">{tx.shopId?.name || 'Unknown shop'}</p>
                    <p className="text-xs text-text-muted">{tx.description} • {formatDate(tx.date)}</p>
                  </div>
                  <CurrencyDisplay
                    value={tx.debit > 0 ? tx.debit : tx.credit}
                    tone={tx.debit > 0 ? 'error' : 'success'}
                    className="flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Package} title="No transactions yet" description="Transactions will appear after you create an entry or record a payment." />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <CardHeading className="mb-0">Shops With Pending Balance</CardHeading>
            <Link to="/shops?status=pending" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data?.priorityOutstandingShops?.length ? (
            <div className="divide-y divide-border">
              {data.priorityOutstandingShops.map((shop) => (
                <Link key={shop._id} to={`/shops/${shop._id}`} className="py-3 flex items-center justify-between gap-3 hover:bg-page -mx-1 px-1 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">{shop.name}</p>
                    <Badge status={shop.status} />
                  </div>
                  <CurrencyDisplay value={shop.currentBalance} tone="error" className="flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Store} title="No pending balances" description="All shops are settled up." />
          )}
        </Card>
      </div>
    </div>
  );
}
