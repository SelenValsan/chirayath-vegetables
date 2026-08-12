import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

export default function Button({ variant = 'primary', loading = false, disabled, children, icon: Icon, className = '', ...rest }) {
  return (
    <button
      className={`${variants[variant]} inline-flex items-center justify-center gap-2 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}
