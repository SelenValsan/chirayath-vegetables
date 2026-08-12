import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page px-4 text-center">
      <Compass className="w-10 h-10 text-primary mb-4" />
      <h1 className="text-xl font-semibold text-text-main mb-1">Page not found</h1>
      <p className="text-sm text-text-muted mb-5">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
