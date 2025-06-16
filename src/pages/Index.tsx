
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../components/auth/AuthPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import EmployeesPage from '../components/employees/EmployeesPage';
import SalarySlipsPage from '../components/salary/SalarySlipsPage';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

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
