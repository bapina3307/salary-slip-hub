
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { SalarySlip, Employee } from '../../types';
import { Upload, Download, FileText, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

const SalarySlipsPage: React.FC = () => {
  const { employee } = useAuth();
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredSlips, setFilteredSlips] = useState<SalarySlip[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [employee]);

  const fetchData = async () => {
    try {
      // Fetch salary slips
      const { data: slipsData, error: slipsError } = await supabase
        .from('salary_slips')
        .select(`
          *,
          profiles!salary_slips_employee_id_fkey(name, email)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (slipsError) throw slipsError;

      // Fetch employees (for admin)
      if (employee?.role === 'admin') {
        const { data: employeesData, error: employeesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'employee')
          .order('name');

        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);
      }

      setSalarySlips(slipsData || []);
      
      // Filter slips based on user role
      if (employee?.role === 'admin') {
        setFilteredSlips(slipsData || []);
      } else {
        setFilteredSlips((slipsData || []).filter(slip => slip.employee_id === employee?.id));
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
        .upload(fileName, uploadFile);

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

  const handleDownload = async (slip: SalarySlip) => {
    try {
      const { data, error } = await supabase.storage
        .from('salary-slips')
        .download(slip.file_url.split('/').pop() || '');

      if (error) throw error;

      // Create download link
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2024', '2023', '2022'];

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
                        {emp.name}
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
                {filteredSlips.map((slip) => {
                  const employeeName = (slip as any).profiles?.name || 'Unknown';
                  
                  return (
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
                            <p><strong>Employee:</strong> {employeeName}</p>
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
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalarySlipsPage;
