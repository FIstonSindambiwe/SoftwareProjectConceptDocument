// src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import authService from '../../services/api/authService';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;