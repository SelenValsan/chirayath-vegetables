import React from 'react';

const styles = {
  active: 'bg-success-bg text-success',
  inactive: 'bg-page text-text-muted',
  overdue: 'bg-error-bg text-error',
  archived: 'bg-page text-text-muted',
  voided: 'bg-page text-text-muted line-through',
  void: 'bg-page text-text-muted line-through',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
  default: 'bg-lightgreen text-primary',
};

export default function Badge({ status, children, className = '' }) {
  const style = styles[status] || styles.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style} ${className}`}>
      {children || status}
    </span>
  );
}
