import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CalendarDays, FileText, Users, Building } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { SalarySlip } from '../../types';

const DashboardHome: React.FC = () => {
  const { employee } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSalarySlips: 0,
    userSalarySlips: 0,
    departments: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [mySalarySlips, setMySalarySlips] = useState<SalarySlip[]>([]);

  // Add state to store signed URLs for salary slips
  const [signedUrls, setSignedUrls] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    fetchStats();
  }, [employee]);

  useEffect(() => {
    // Get the latest month and year from salary_slips
    const fetchCurrentPeriod = async () => {
      const { data, error } = await supabase
        .from('salary_slips')
        .select('month, year')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        console.log('Fetched current period:', data[0]);
        setCurrentMonth(data[0].month);
        setCurrentYear(data[0].year.toString());
      } else {
        // fallback to current system month/year if no data
        const now = new Date();
        setCurrentMonth(now.toLocaleString('default', { month: 'long' }));
        setCurrentYear(now.getFullYear().toString());
      }
    };
    fetchCurrentPeriod();
  }, []);

  // Month helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // State for filter
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);

  // Fetch salary slips for the logged-in employee using employee_id from profile
  // useEffect(() => {
  //   const fetchMySalarySlips = async () => {
  //     if (employee?.role === 'employee') {
  //       // Get employee_id from profile
  //       const { data: profile, error: profileError } = await supabase
  //         .from('profiles')
  //         .select('employee_id')
  //         .eq('id', employee.id)
  //         .single();
  //       if (!profileError && profile?.employee_id) {
  //         setProfileEmployeeId(profile.employee_id);
  //         // Fetch salary slips for this employee_id
  //         const { data, error } = await supabase
  //           .from('salary_slips')
  //           .select('*')
  //           .eq('employee_id', profile.employee_id)
  //           .order('year', { ascending: false })
  //           .order('month', { ascending: false });
  //         if (data) setMySalarySlips(data);
  //       } else {
  //         setMySalarySlips([]);
  //       }
  //     } else {
  //       setMySalarySlips([]);
  //     }
  //   };
  //   fetchMySalarySlips();
  // }, [employee]);

  useEffect(() => {
  const fetchMySalarySlips = async () => {
    if (employee?.role === 'employee') {
      // Get employee_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('employee_id')
        .eq('id', employee.id)
        .single();
      if (!profileError && profile?.employee_id) {
        setProfileEmployeeId(profile.employee_id);
        // Fetch salary slips for this employee_id
        const { data, error } = await supabase
          .from('salary_slips')
          .select('*')
          .eq('employee_id', profile.employee_id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });
        if (data) setMySalarySlips(data);
      } else {
        setMySalarySlips([]);
      }
    } else if (employee?.role === 'admin') {
      // Admin: fetch all salary slips
      const { data, error } = await supabase
        .from('salary_slips')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (data) setMySalarySlips(data);
    } else {
      setMySalarySlips([]);
    }
  };
  fetchMySalarySlips();
}, [employee]);

  // Update userSalarySlips count whenever mySalarySlips changes
  useEffect(() => {
    if (employee?.role === 'employee') {
      setStats(prev => ({ ...prev, userSalarySlips: mySalarySlips.length }));
    }
  }, [mySalarySlips, employee]);

  const fetchStats = async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch total salary slips
      const { count: salarySlipCount } = await supabase
        .from('salary_slips')
        .select('*', { count: 'exact', head: true });
console.log('Employee count:', employeeCount);
      // Fetch unique departments
      const { data: departmentData } = await supabase
        .from('profiles')
        .select('department')
        .not('department', 'is', null);

      const uniqueDepartments = new Set(departmentData?.map(d => d.department)).size;

      // Fetch user salary slip count (for employees)
      let userSalarySlips = 0;
      if (employee?.role === 'employee') {
        // Get employee_id from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('employee_id')
          .eq('id', employee.id)
          .single();
        if (!profileError && profile?.employee_id) {
          console.log('Fetching salary slips for employee_id:', profile.employee_id);
          const { count: userSlipCount } = await supabase
            .from('salary_slips')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', profile.employee_id);
            console.log('User salary slip count:', userSlipCount);
          userSalarySlips = userSlipCount || 0;
        }
      }

      setStats(prev => ({
        ...prev,
        totalEmployees: employeeCount || 0,
        totalSalarySlips: salarySlipCount || 0,
        departments: uniqueDepartments,
        userSalarySlips
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate signed URLs for all salary slips when mySalarySlips changes
  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!mySalarySlips.length) return;
      const urls: { [id: string]: string } = {};
      for (const slip of mySalarySlips) {
        // Extract the storage path from file_url
        // file_url example: .../salary-slips/<folder>/<year>/<file>
        const match = slip.file_url.match(/salary-slips\/(.*)$/);
        const path = match ? match[1] : '';
        if (path) {
          const { data, error } = await supabase.storage
            .from('salary-slips')
            .createSignedUrl(path, 60 * 60); // 1 hour expiry
          if (data?.signedUrl) {
            urls[slip.id] = data.signedUrl;
          } else {
            urls[slip.id] = '';
          }
        } else {
          urls[slip.id] = '';
        }
      }
      setSignedUrls(urls);
    };
    generateSignedUrls();
  }, [mySalarySlips]);

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
      value: currentMonth && currentYear ? `${currentMonth} ${currentYear}` : '',
      description: 'Current period',
      icon: CalendarDays,
      color: 'bg-orange-500',
      show: true
    }
  ].filter(stat => stat.show);

  // Get unique years from salary slips
  const uniqueYears = Array.from(new Set(mySalarySlips.map(s => s.year))).sort((a, b) => b - a);
  // Get unique months from salary slips (handle both numbers and names)
  const numericMonths = mySalarySlips.map(s => typeof s.month === 'number' ? s.month : monthNames.indexOf(s.month) + 1).filter(m => m > 0);
  const uniqueMonthNumbers = Array.from(new Set(numericMonths)).sort((a, b) => a - b);
  const uniqueMonths = uniqueMonthNumbers.map(m => monthNames[m - 1]);

  // Set default filter to current month/year when salary slips load
  useEffect(() => {
    if (mySalarySlips.length > 0 && currentMonth && currentYear) {
      setFilterMonth(currentMonth);
      setFilterYear(currentYear);
    }
  }, [mySalarySlips, currentMonth, currentYear]);

  // Filtered slips
  const filteredSlips = mySalarySlips.filter(slip => {
    const slipMonthName = typeof slip.month === 'number' ? monthNames[slip.month - 1] : slip.month;
    return (
      (!filterYear || slip.year.toString() === filterYear) &&
      (!filterMonth || slipMonthName === filterMonth)
    );
  });

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

      {/* Show employee's salary slips if logged in as employee */}
      {employee?.role === 'employee' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Salary Slips</CardTitle>
            <CardDescription>Download your salary slips for each month</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Current month slip prominently displayed */}
            {(() => {
              const now = new Date();
              const currentMonthName = monthNames[now.getMonth()];
              const currentYearNum = now.getFullYear();
              const currentSlip = mySalarySlips.find(slip => {
                const slipMonthName = typeof slip.month === 'number' ? monthNames[slip.month - 1] : slip.month;
                return slipMonthName === currentMonthName && slip.year === currentYearNum;
              });
              return currentSlip ? (
                <div className="mb-6 p-4 border-2 border-green-500 rounded-lg bg-green-50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg text-green-700">Current Month Slip</div>
                    <div className="text-md">{currentMonthName} {currentYearNum}</div>
                  </div>
                  {signedUrls[currentSlip.id] ? (
                    <a
                      href={signedUrls[currentSlip.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 font-bold underline"
                      download={currentSlip.file_name}
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-gray-400">No file</span>
                  )}
                </div>
              ) : null;
            })()}

            {/* All 12 months grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthNames.map((month, idx) => {
                const slip = mySalarySlips.find(slip => {
                  const slipMonthName = typeof slip.month === 'number' ? monthNames[slip.month - 1] : slip.month;
                  return slipMonthName === month && slip.year === new Date().getFullYear();
                });
                return (
                  <div key={month} className="p-4 border rounded flex items-center justify-between bg-white">
                    <span className="font-medium">{month} {new Date().getFullYear()}</span>
                    {slip && signedUrls[slip.id] ? (
                      <a
                        href={signedUrls[slip.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        download={slip.file_name}
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-gray-400">No file</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHome;
