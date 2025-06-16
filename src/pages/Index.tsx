
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../components/auth/AuthPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import EmployeesPage from '../components/employees/EmployeesPage';
import SalarySlipsPage from '../components/salary/SalarySlipsPage';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'employees':
        return <EmployeesPage />;
      case 'salary-slips':
        return <SalarySlipsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
};

export default Index;
