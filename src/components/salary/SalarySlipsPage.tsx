
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

const SalarySlipsPage: React.FC = () => {
  const { employee } = useAuth();
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [filteredSlips, setFilteredSlips] = useState<SalarySlip[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    // Mock salary slip data - in real app, this would be fetched from your Node.js API
    const mockSlips: SalarySlip[] = [
      {
        id: '1',
        employeeId: '2',
        month: 'November',
        year: 2024,
        fileName: 'john_doe_november_2024.pdf',
        uploadDate: '2024-12-01',
        fileUrl: '#'
      },
      {
        id: '2',
        employeeId: '2',
        month: 'October',
        year: 2024,
        fileName: 'john_doe_october_2024.pdf',
        uploadDate: '2024-11-01',
        fileUrl: '#'
      },
      {
        id: '3',
        employeeId: '3',
        month: 'November',
        year: 2024,
        fileName: 'jane_smith_november_2024.pdf',
        uploadDate: '2024-12-01',
        fileUrl: '#'
      }
    ];

    setSalarySlips(mockSlips);
    
    // Filter slips based on user role
    if (employee?.role === 'admin') {
      setFilteredSlips(mockSlips);
    } else {
      setFilteredSlips(mockSlips.filter(slip => slip.employeeId === employee?.id));
    }
  }, [employee]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadFile || !selectedMonth || !selectedYear || !selectedEmployee) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    // Mock upload - in real app, this would upload to your Node.js backend
    const newSlip: SalarySlip = {
      id: Date.now().toString(),
      employeeId: selectedEmployee,
      month: selectedMonth,
      year: parseInt(selectedYear),
      fileName: uploadFile.name,
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: '#'
    };

    setSalarySlips(prev => [...prev, newSlip]);
    setFilteredSlips(prev => [...prev, newSlip]);
    
    // Reset form
    setUploadFile(null);
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedEmployee('');
    
    toast.success('Salary slip uploaded successfully!');
  };

  const handleDownload = (slip: SalarySlip) => {
    // Mock download - in real app, this would download from your Node.js backend
    toast.success(`Downloading ${slip.fileName}`);
    console.log('Downloading salary slip:', slip);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2024', '2023', '2022'];

  const mockEmployees = [
    { id: '2', name: 'John Doe' },
    { id: '3', name: 'Jane Smith' },
    {id: '4', name: 'Mike Johnson' },
    { id: '5', name: 'Sarah Wilson' }
  ];

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
                    {mockEmployees.map(emp => (
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
            
            <Button onClick={handleUploadSubmit} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Salary Slip
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
                  const employeeName = mockEmployees.find(emp => emp.id === slip.employeeId)?.name || 'Unknown';
                  
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
                          <p><strong>File:</strong> {slip.fileName}</p>
                          <p><strong>Uploaded:</strong> {new Date(slip.uploadDate).toLocaleDateString()}</p>
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
