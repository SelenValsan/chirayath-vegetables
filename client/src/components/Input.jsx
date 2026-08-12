import React from 'react';

export default function Input({ label, error, required, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && (
        <label className="label-field">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input className={`input-field ${error ? 'border-error' : ''}`} {...rest} />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
