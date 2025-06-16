
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { LogOut, Users, FileText, Home } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { employee, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, access: ['admin', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, access: ['admin'] },
    { id: 'salary-slips', label: 'Salary Slips', icon: FileText, access: ['admin', 'employee'] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.access.includes(employee?.role || 'employee')
  );

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
              onClick={logout}
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
