import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Entries from './pages/Entries';
import EntryForm from './pages/EntryForm';
import EntryDetail from './pages/EntryDetail';
import Payments from './pages/Payments';
import Transactions from './pages/Transactions';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:id" element={<ShopDetail />} />

        <Route path="/entries" element={<Entries />} />
        <Route path="/entries/new" element={<EntryForm />} />
        <Route path="/entries/:id/edit" element={<EntryForm />} />
        <Route path="/entries/:id" element={<EntryDetail />} />

        <Route path="/payments" element={<Payments />} />

        <Route path="/transactions" element={<Transactions />} />

        <Route path="/receipts" element={<Receipts />} />
        <Route path="/receipts/:id" element={<ReceiptDetail />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
