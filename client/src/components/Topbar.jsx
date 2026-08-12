import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Plus, Search, Loader2 } from 'lucide-react';
import * as searchService from '../services/searchService';
import { formatCurrency } from '../utils/currency';

export default function Topbar({ title, onMenuClick }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchService
        .globalSearch(query.trim())
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => setResults(null))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const goTo = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults =
    results && (results.shops?.length || results.entries?.length || results.payments?.length || results.receipts?.length || results.products?.length);

  return (
    <header className="h-16 bg-white border-b border-border flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-text-secondary" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-[20px] font-semibold text-text-main hidden sm:block whitespace-nowrap">{title}</h1>

      <div className="flex-1 max-w-md relative" ref={boxRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search shops, entries, receipts..."
          className="input-field pl-9"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}

        {open && query && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-border rounded-card shadow-xl max-h-96 overflow-y-auto z-50">
            {!hasResults && !searching && (
              <p className="text-sm text-text-muted text-center py-6">No results for "{query}"</p>
            )}
            {results?.shops?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-text-muted px-2 py-1">Shops</p>
                {results.shops.map((s) => (
                  <button key={s._id} onClick={() => goTo(`/shops/${s._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-page flex items-center justify-between">
                    <span className="text-sm text-text-main">{s.name}</span>
                    <span className="text-xs text-text-muted">{formatCurrency(s.currentBalance)}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.entries?.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs font-medium text-text-muted px-2 py-1">Entries</p>
                {results.entries.map((e) => (
                  <button key={e._id} onClick={() => goTo(`/entries/${e._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-page flex items-center justify-between">
                    <span className="text-sm text-text-main">{e.shopId?.name || 'Entry'}</span>
                    <span className="text-xs text-text-muted">{formatCurrency(e.total)}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.payments?.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs font-medium text-text-muted px-2 py-1">Payments</p>
                {results.payments.map((p) => (
                  <button key={p._id} onClick={() => goTo(`/payments/${p._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-page flex items-center justify-between">
                    <span className="text-sm text-text-main">{p.shopId?.name || 'Payment'}</span>
                    <span className="text-xs text-text-muted">{formatCurrency(p.amount)}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.receipts?.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs font-medium text-text-muted px-2 py-1">Receipts</p>
                {results.receipts.map((r) => (
                  <button key={r._id} onClick={() => goTo(`/receipts/${r._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-page flex items-center justify-between">
                    <span className="text-sm text-text-main">{r.receiptNumber}</span>
                    <span className="text-xs text-text-muted">{r.shopId?.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results?.products?.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs font-medium text-text-muted px-2 py-1">Products</p>
                {results.products.map((p) => (
                  <div key={p._id} className="px-2 py-2 text-sm text-text-main">{p.name}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="relative p-2 text-text-secondary hover:text-text-main hover:bg-page rounded-lg" aria-label="Notifications">
        <Bell className="w-5 h-5" />
      </button>

      <button onClick={() => navigate('/entries/new')} className="btn-primary hidden sm:inline-flex items-center gap-2 whitespace-nowrap">
        <Plus className="w-4 h-4" />
        New Entry
      </button>
    </header>
  );
}
