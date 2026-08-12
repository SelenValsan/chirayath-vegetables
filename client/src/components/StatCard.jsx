import React from 'react';
import { formatCurrency, formatNumber } from '../utils/currency';

const toneClasses = {
  default: 'text-text-main',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export default function StatCard({ label, value, isCurrency = true, icon: Icon, tone = 'default', sublabel }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-lightgreen flex items-center justify-center flex-shrink-0">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
        )}
      </div>
      <p className={`text-[28px] font-semibold mt-2 ${toneClasses[tone]}`}>
        {isCurrency ? formatCurrency(value) : formatNumber(value)}
      </p>
      {sublabel && <p className="text-xs text-text-muted mt-1">{sublabel}</p>}
    </div>
  );
}
