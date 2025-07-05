import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { LogOut, Users, FileText, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileOptions from '../auth/ProfileOptions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { supabase } from '../../integrations/supabase/client';
import { toast } from '../ui/sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = React.useState(false);

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
  
  const handleChangePassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white text-gray-800 shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {employee?.name}</p>
          </div>
          <div className="relative">
            <Button
              className="flex items-center gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring focus:ring-gray-400 rounded-full px-4 py-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="font-medium">{employee?.name || 'User'}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 9.293a1 1 0 011.414 0L10 12.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
            {dropdownOpen && (
              <ul className="absolute right-0 mt-2 bg-white shadow-lg rounded-md p-2 w-48">
                <li className="hover:bg-gray-100 rounded-md">
                  <Button
                    variant="link"
                    className="w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900"
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </li>
                <li className="hover:bg-gray-100 rounded-md">
                  <Button
                    variant="link"
                    className="w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900"
                    onClick={logout}
                  >
                    Log Out
                  </Button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 shadow-sm min-h-screen border-r">
          <nav className="p-4">
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    className={`w-full justify-start text-gray-800 hover:bg-gray-200 hover:text-gray-900 ${currentPage === item.id ? 'bg-gray-300' : ''}`}
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

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
            <Input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
