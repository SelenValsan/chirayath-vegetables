import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, Wallet, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import * as reportService from '../services/reportService';
import { Card, CardHeading } from '../components/Card';
import StatCard from '../components/StatCard';
import Select from '../components/Select';
import CurrencyDisplay from '../components/CurrencyDisplay';
import EmptyState from '../components/EmptyState';
import { StatGridSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/currency';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export default function Reports() {
  const [range, setRange] = useState('month');
  const [sales, setSales] = useState(null);
  const [payments, setPayments] = useState(null);
  const [outstanding, setOutstanding] = useState(null);
  const [topShops, setTopShops] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      reportService.getSalesReport({ range }),
      reportService.getPaymentsReport({ range }),
      reportService.getOutstandingReport(),
      reportService.getTopShops({ limit: 5 }),
      reportService.getTopProducts({ limit: 5 }),
    ])
      .then(([salesRes, paymentsRes, outstandingRes, topShopsRes, topProductsRes]) => {
        setSales(salesRes);
        setPayments(paymentsRes);
        setOutstanding(outstandingRes);
        setTopShops(topShopsRes);
        setTopProducts(topProductsRes);
      })
      .catch((err) => toast.error(err.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <StatGridSkeleton count={4} />;

  const paidVsOutstandingData = [
    { name: 'Collected', value: payments?.totalReceived || 0 },
    { name: 'Outstanding', value: outstanding?.totalOutstanding || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={range} onChange={(e) => setRange(e.target.value)} options={RANGES} className="w-44" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sales" value={sales?.totalSales} icon={TrendingUp} />
        <StatCard label="Payments Received" value={payments?.totalReceived} icon={Wallet} tone="success" />
        <StatCard label="Outstanding Balance" value={outstanding?.totalOutstanding} icon={AlertCircle} tone="warning" />
        <StatCard label="Collection Rate" value={outstanding?.collectionRate} isCurrency={false} icon={Percent} sublabel="% of billed amount collected" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeading>Sales Trend</CardHeading>
          {sales?.trend?.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#4F772D" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No sales data" description="Sales trend will appear once entries are recorded in this range." />
          )}
        </Card>

        <Card>
          <CardHeading>Paid vs Outstanding</CardHeading>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paidVsOutstandingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716C' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#4F772D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeading>Top Purchasing Shops</CardHeading>
          {topShops.length ? (
            <div className="divide-y divide-border">
              {topShops.map((s, i) => (
                <Link key={s._id} to={`/shops/${s._id}`} className="flex items-center justify-between py-3 hover:bg-page -mx-1 px-1 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-lightgreen text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium text-text-main">{s.shopName}</span>
                  </div>
                  <CurrencyDisplay value={s.totalPurchases} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No purchase data yet" description="Top shops will appear once entries are recorded." />
          )}
        </Card>

        <Card>
          <CardHeading>Most Sold Products</CardHeading>
          {topProducts.length ? (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={p.productName} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-lightgreen text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-text-main">{p.productName}</p>
                      <p className="text-xs text-text-muted">{Math.round(p.totalQuantity * 100) / 100} kg sold</p>
                    </div>
                  </div>
                  <CurrencyDisplay value={p.totalAmount} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No product data yet" description="Top products will appear once entries are recorded." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeading>Shops With Outstanding Balance</CardHeading>
        {outstanding?.shops?.length ? (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm" style={{ minWidth: '480px' }}>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-text-secondary py-2.5 px-3">Shop</th>
                  <th className="text-left font-medium text-text-secondary py-2.5 px-3">Phone</th>
                  <th className="text-left font-medium text-text-secondary py-2.5 px-3">Status</th>
                  <th className="text-right font-medium text-text-secondary py-2.5 px-3">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {outstanding.shops.map((s) => (
                  <tr key={s._id}>
                    <td className="py-2.5 px-3"><Link to={`/shops/${s._id}`} className="font-medium text-text-main hover:text-primary">{s.name}</Link></td>
                    <td className="py-2.5 px-3 text-text-secondary">{s.phone}</td>
                    <td className="py-2.5 px-3 capitalize text-text-secondary">{s.status}</td>
                    <td className="py-2.5 px-3 text-right"><CurrencyDisplay value={s.currentBalance} tone="error" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No outstanding balances" description="All shops are fully settled up." />
        )}
      </Card>
    </div>
  );
}
