import React from 'react';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/sonner';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
