
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, FileText, Users, Building } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

const DashboardHome: React.FC = () => {
  const { employee } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSalarySlips: 0,
    userSalarySlips: 0,
    departments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [employee]);

  const fetchStats = async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total salary slips
      const { count: salarySlipCount } = await supabase
        .from('salary_slips')
        .select('*', { count: 'exact', head: true });

      // Fetch user's salary slips
      const { count: userSlipCount } = await supabase
        .from('salary_slips')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employee?.id);

      // Fetch unique departments
      const { data: departmentData } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null);

      const uniqueDepartments = new Set(departmentData?.map(d => d.department)).size;

      setStats({
        totalEmployees: employeeCount || 0,
        totalSalarySlips: salarySlipCount || 0,
        userSalarySlips: userSlipCount || 0,
        departments: uniqueDepartments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toString(),
      description: 'Active employees',
      icon: Users,
      color: 'bg-blue-500',
      show: employee?.role === 'admin'
    },
    {
      title: 'Your Salary Slips',
      value: stats.userSalarySlips.toString(),
      description: 'Available for download',
      icon: FileText,
      color: 'bg-green-500',
      show: employee?.role === 'employee'
    },
    {
      title: 'All Salary Slips',
      value: stats.totalSalarySlips.toString(),
      description: 'In the system',
      icon: FileText,
      color: 'bg-green-500',
      show: employee?.role === 'admin'
    },
    {
      title: 'Departments',
      value: stats.departments.toString(),
      description: 'Active departments',
      icon: Building,
      color: 'bg-purple-500',
      show: employee?.role === 'admin'
    },
    {
      title: 'This Month',
      value: 'December 2024',
      description: 'Current period',
      icon: CalendarDays,
      color: 'bg-orange-500',
      show: true
    }
  ].filter(stat => stat.show);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {employee?.name}</p>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Profile
            <Badge variant={employee?.role === 'admin' ? 'default' : 'secondary'}>
              {employee?.role === 'admin' ? 'Administrator' : 'Employee'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg">{employee?.email}</p>
            </div>
            {employee?.department && (
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="text-lg">{employee.department}</p>
              </div>
            )}
            {employee?.position && (
              <div>
                <p className="text-sm font-medium text-gray-500">Position</p>
                <p className="text-lg">{employee.position}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">View Salary Slips</h3>
              <p className="text-sm text-gray-500">Download your monthly salary slips</p>
            </div>
            {employee?.role === 'admin' && (
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <h3 className="font-medium">Manage Employees</h3>
                <p className="text-sm text-gray-500">View and manage employee records</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
