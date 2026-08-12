import React from 'react';

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeading({ children, className = '' }) {
  return <h3 className={`text-base font-semibold text-text-main mb-3 ${className}`}>{children}</h3>;
}
