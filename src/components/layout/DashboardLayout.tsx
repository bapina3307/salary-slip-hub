import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { LogOut, Users, FileText, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();

  // Show spinner while loading employee
  if (employee === null) {
    // After a short delay, redirect to login if employee is still null
    React.useEffect(() => {
      const timeout = setTimeout(() => {
        if (employee === null) {
          navigate('/'); // Redirect to login page
        }
      }, 2000); // 2 seconds
      return () => clearTimeout(timeout);
    }, [employee, navigate]);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, access: ['admin', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, access: ['admin'] },
    { id: 'salary-slips', label: 'Salary Slips', icon: FileText, access: ['admin', 'employee'] }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Only show Employees link if admin
    if (item.id === 'employees') {
      return employee?.role === 'admin';
    }
    return item.access.includes(employee?.role || 'employee');
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {employee?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 px-3 py-1 bg-blue-100 rounded-full">
              {employee?.role === 'admin' ? 'Administrator' : 'Employee'}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                await logout();
                navigate('/'); // Redirect to login after logout
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen border-r">
          <nav className="p-4">
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
