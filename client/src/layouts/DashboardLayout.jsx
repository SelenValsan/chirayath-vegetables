import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/shops': 'Shops',
  '/entries': 'Daily Entries',
  '/payments': 'Payments',
  '/transactions': 'Transactions',
  '/receipts': 'Receipts',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

function resolveTitle(pathname) {
  if (titleMap[pathname]) return titleMap[pathname];
  const base = '/' + pathname.split('/')[1];
  if (titleMap[base]) {
    if (pathname.includes('/new')) return `New ${titleMap[base].replace(/s$/, '')}`;
    if (pathname.includes('/edit')) return `Edit ${titleMap[base].replace(/s$/, '')}`;
    return titleMap[base];
  }
  return 'Chirayath Vegetables';
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={resolveTitle(location.pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
