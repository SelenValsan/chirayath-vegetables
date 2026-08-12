import React from 'react';
import { formatCurrency } from '../utils/currency';

export default function CurrencyDisplay({ value, className = '', tone }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'error' ? 'text-error' : '';
  return <span className={`font-semibold tabular-nums ${toneClass} ${className}`}>{formatCurrency(value)}</span>;
}
