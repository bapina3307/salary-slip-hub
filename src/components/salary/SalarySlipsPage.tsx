import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { SalarySlip } from '../../types';
import { Upload, Download, FileText, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

// Add a local type for joined salary slip with employees
interface SalarySlipWithEmployee extends SalarySlip {
  employees?: {
    Name?: string | null;
    employee_code?: string | null;
  };
}

const SalarySlipsPage: React.FC = () => {
  const { employee } = useAuth();
  // Use correct keys for employees from Supabase
  const [employees, setEmployees] = useState<{ id: string; Name: string | null; employee_code: string | null }[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlipWithEmployee[]>([]);
  const [filteredSlips, setFilteredSlips] = useState<SalarySlipWithEmployee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      let empId = null;
      if (employee?.role === 'employee') {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('employee_id')
          .eq('id', employee.id)
          .single();
        empId = profile?.employee_id || null;
        setProfileEmployeeId(empId);
        console.log('Employee profile employee_id:', empId, 'profile:', profile, 'error:', error);
      }
      // Fetch salary slips with joined employees
      const { data: slipsData, error: slipsError } = await supabase
        .from('salary_slips')
        .select(`*, employees:employee_id (Name, employee_code)`)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      console.log('Fetched salary slips:', slipsData, 'error:', slipsError);
      if (slipsError) throw slipsError;
      // Fetch employees (for admin)
      if (employee?.role === 'admin') {
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, Name, employee_code')
          .order('Name');
        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);
        console.log('Fetched employees:', employeesData, 'error:', employeesError);
      }
      setSalarySlips((slipsData as SalarySlipWithEmployee[]) || []);
      // Filter slips based on user role
      if (employee?.role === 'admin') {
        setFilteredSlips((slipsData as SalarySlipWithEmployee[]) || []);
      } else {
        setFilteredSlips(((slipsData as SalarySlipWithEmployee[]) || []).filter(slip => slip.employee_id === empId));
      }
      setLoading(false);
    };
    fetchData();
  }, [employee]);

  const fetchData = async () => {
    try {
      // Fetch salary slips with joined employees
      const { data: slipsData, error: slipsError } = await supabase
        .from('salary_slips')
        .select(`*, employees:employee_id (Name, employee_code)`)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (slipsError) throw slipsError;

      // Fetch employees (for admin)
      if (employee?.role === 'admin') {
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, Name, employee_code')
          .order('Name');

        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);
      }

      setSalarySlips((slipsData as SalarySlipWithEmployee[]) || []);
      // Filter slips based on user role
      if (employee?.role === 'admin') {
        setFilteredSlips((slipsData as SalarySlipWithEmployee[]) || []);
      } else {
        setFilteredSlips(((slipsData as SalarySlipWithEmployee[]) || []).filter(slip => slip.employee_id === employee?.id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedMonth || !selectedYear || !selectedEmployee) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    setUploading(true);

    try {
      // Create a unique file path
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${selectedEmployee}/${selectedYear}/${selectedMonth}.${fileExt}`;
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('salary-slips')
        .upload(fileName, uploadFile, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('salary-slips')
        .getPublicUrl(fileName);
      // Insert salary slip record
      const { error: insertError } = await supabase
        .from('salary_slips')
        .insert({
          employee_id: selectedEmployee,
          month: selectedMonth,
          year: parseInt(selectedYear),
          file_name: uploadFile.name,
          file_url: publicUrl,
          file_size: uploadFile.size,
          uploaded_by: employee?.id
          // file_path removed
        });
      if (insertError) throw insertError;
      toast.success('Salary slip uploaded successfully!');
      // Reset form
      setUploadFile(null);
      setSelectedMonth('');
      setSelectedYear('');
      setSelectedEmployee('');
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload salary slip');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (slip: SalarySlipWithEmployee) => {
    try {
      let filePath = slip.file_path || `${slip.employee_id}/${slip.year}/${slip.month}.pdf`;
      if (filePath.startsWith('http')) {
        const idx = filePath.indexOf('/salary-slips/');
        if (idx !== -1) {
          filePath = filePath.substring(idx + '/salary-slips/'.length);
        }
      }
      const { data, error } = await supabase.storage
        .from('salary-slips')
        .download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = slip.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${slip.file_name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  useEffect(() => {
    let slips = salarySlips;
    if (employee?.role !== 'admin') {
      slips = slips.filter(slip => slip.employee_id === profileEmployeeId);
    }
    if (selectedMonth) {
      slips = slips.filter(slip => slip.month === selectedMonth);
    }
    if (selectedYear) {
      slips = slips.filter(slip => String(slip.year) === selectedYear);
    }
    setFilteredSlips(slips);
  }, [salarySlips, employee, profileEmployeeId, selectedMonth, selectedYear]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = ['2025', '2026', '2027'];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading salary slips...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Salary Slips</h1>
        <p className="text-gray-600">
          {employee?.role === 'admin' 
            ? 'Upload and manage employee salary slips' 
            : 'View and download your salary slips'
          }
        </p>
      </div>

      {/* Upload Section - Admin Only */}
      {employee?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Salary Slip
            </CardTitle>
            <CardDescription>
              Upload PDF salary slips for employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.Name} ({emp.employee_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
              />
              {uploadFile && (
                <p className="text-sm text-green-600">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleUploadSubmit} 
              className="flex items-center gap-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Salary Slip'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add filter controls above the salary slips list */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div>
          <Label htmlFor="filter-month">Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-year">Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(selectedMonth || selectedYear) && (
          <Button variant="outline" onClick={() => { setSelectedMonth(''); setSelectedYear(''); }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Salary Slips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {employee?.role === 'admin' ? 'All Salary Slips' : 'Your Salary Slips'}
          </CardTitle>
          <CardDescription>
            {filteredSlips.length} salary slip(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSlips.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No salary slips found</h3>
                <p className="text-gray-600">
                  {employee?.role === 'admin' 
                    ? 'Upload salary slips for employees to get started'
                    : 'Your salary slips will appear here once uploaded by HR'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSlips.map((slip) => (
                  <Card key={slip.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span className="font-medium">{slip.month} {slip.year}</span>
                        </div>
                        <Badge variant="outline">PDF</Badge>
                      </div>
                      {employee?.role === 'admin' && (
                        <div className="text-sm text-gray-600">
                          <p><strong>Employee:</strong> {slip.employees?.Name} ({slip.employees?.employee_code})</p>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <p><strong>File:</strong> {slip.file_name}</p>
                        <p><strong>Uploaded:</strong> {new Date(slip.upload_date).toLocaleDateString()}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full flex items-center gap-2"
                        onClick={() => handleDownload(slip)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalarySlipsPage;
