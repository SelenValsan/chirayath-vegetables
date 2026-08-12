import React from 'react';

export default function Table({ columns, children, minWidth = '720px' }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className={`text-left font-medium text-text-secondary py-3 px-3 whitespace-nowrap ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr className={`${onClick ? 'cursor-pointer hover:bg-page' : ''} transition-colors ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return <td className={`py-3.5 px-3 text-text-main whitespace-nowrap ${className}`}>{children}</td>;
}
