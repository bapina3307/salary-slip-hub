
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, FileText, Users, Building } from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { employee } = useAuth();

  const stats = [
    {
      title: 'Total Employees',
      value: '156',
      description: 'Active employees',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Salary Slips',
      value: '12',
      description: 'This year',
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      title: 'Departments',
      value: '8',
      description: 'Active departments',
      icon: Building,
      color: 'bg-purple-500'
    },
    {
      title: 'This Month',
      value: 'December 2024',
      description: 'Current period',
      icon: CalendarDays,
      color: 'bg-orange-500'
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
