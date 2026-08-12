import React from 'react';

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3.5 border-b border-border">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-4 bg-border/70 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 w-24 bg-border/70 rounded mb-3" />
      <div className="h-7 w-32 bg-border/70 rounded" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
