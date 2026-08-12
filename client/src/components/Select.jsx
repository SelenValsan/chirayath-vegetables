import React from 'react';

export default function Select({ label, error, required, options = [], placeholder, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && (
        <label className="label-field">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <select className={`input-field ${error ? 'border-error' : ''}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
