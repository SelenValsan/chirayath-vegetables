import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const UNITS = ['kg', 'g', 'piece', 'bundle', 'box', 'crate'];

export default function ProductEntryRow({ item, index, products, onChange, onRemove, canRemove }) {
  const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

  const handleProductSelect = (e) => {
    const value = e.target.value;
    const matched = products.find((p) => p.name === value);
    onChange(index, {
      ...item,
      productName: value,
      productId: matched?._id || undefined,
      unit: matched?.defaultUnit || item.unit,
      rate: matched ? matched.defaultRate : item.rate,
    });
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-start py-2.5 border-b border-border last:border-0">
      <div className="col-span-12 sm:col-span-4">
        <input
          list="product-options"
          value={item.productName}
          onChange={handleProductSelect}
          placeholder="Product name"
          className="input-field"
          aria-label={`Product ${index + 1}`}
        />
        <datalist id="product-options">
          {products.map((p) => (
            <option key={p._id} value={p.name} />
          ))}
        </datalist>
      </div>
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          min="0.001"
          step="0.01"
          value={item.quantity}
          onChange={(e) => onChange(index, { ...item, quantity: e.target.value })}
          placeholder="Qty"
          className="input-field"
          aria-label={`Quantity for item ${index + 1}`}
        />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <select
          value={item.unit}
          onChange={(e) => onChange(index, { ...item, unit: e.target.value })}
          className="input-field"
          aria-label={`Unit for item ${index + 1}`}
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.rate}
          onChange={(e) => onChange(index, { ...item, rate: e.target.value })}
          placeholder="Rate"
          className="input-field"
          aria-label={`Rate for item ${index + 1}`}
        />
      </div>
      <div className="col-span-10 sm:col-span-1 flex items-center h-[42px] text-sm font-medium text-text-main">
        {formatCurrency(amount)}
      </div>
      <div className="col-span-2 sm:col-span-1 flex items-center h-[42px]">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          aria-label="Remove item"
          className="p-2 rounded-lg text-error hover:bg-error-bg disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
