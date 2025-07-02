import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { EmployeeData } from '../../types';
import { Search, Plus, Mail, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { v4 as uuidv4 } from 'uuid';

const EmployeesPage: React.FC = () => {
  const { employee: currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    employee_code: '',
    Name: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<{ open: boolean; employee: EmployeeData | null }>({ 
    open: false, 
    employee: null 
  });
  const [editForm, setEditForm] = useState({ 
    employee_code: '',
    Name: '', 
    phone: '', 
    address: '',  
    status: 'active' as 'active' | 'inactive'
  });
  const [editLoading, setEditLoading] = useState(false);

  // View Details modal state
  const [viewModal, setViewModal] = useState<{ open: boolean; employee: EmployeeData | null }>({ 
    open: false, 
    employee: null 
  });

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; employee: EmployeeData | null }>({
    open: false,
    employee: null
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Failed to load employees: ' + error.message);        return;
      }
      
      // Type-cast the data to ensure proper typing
      const typedEmployees = data.map(emp => ({
        ...emp,
        status: emp.status as 'active' | 'inactive'
      }));
      
      setEmployees(typedEmployees);
      setFilteredEmployees(typedEmployees);
      toast.success('Employees loaded successfully');
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = employees.filter(emp =>
      (emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (emp.Name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (emp.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (emp.address?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleAddEmployee = async () => {
    if (!addForm.employee_code?.trim()) {
      toast.error('Employee Code is required');
      return;
    }
    
    if (!addForm.Name?.trim()) {
      toast.error('Name is required');
      return;
    }

    setAddLoading(true);
    
    try {
      const newEmployee: EmployeeData = {
        id: uuidv4(),
        profile_id: null,
        employee_code: addForm.employee_code,
        Name: addForm.Name,
        phone: addForm.phone || '',
        address: addForm.address || '',
        status: addForm.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('employees').insert([newEmployee]);
      if (error) throw error;

      setEmployees(prev => [newEmployee, ...prev]);
      setFilteredEmployees(prev => [newEmployee, ...prev]);
      
      toast.success('Employee added successfully!');
      setShowAddModal(false);
      setAddForm({ 
        employee_code: '', 
        Name: '', 
        phone: '', 
        address: '', 
        status: 'active' 
      });
      
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast.error(error?.message || 'Failed to add employee');
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (emp: EmployeeData) => {
    setEditForm({
      employee_code: emp.employee_code || '',
      Name: emp.Name || '',
      phone: emp.phone || '',
      address: emp.address || '',
      status: emp.status || 'active',
    });
    setEditModal({ open: true, employee: emp });
  };

  const handleEditEmployee = async () => {
    if (!editModal.employee) return;
    
    if (!editForm.employee_code?.trim()) {
      toast.error('Employee Code is required');
      return;
    }
    
    if (!editForm.Name?.trim()) {
      toast.error('Name is required');
      return;
    }

    setEditLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({
          employee_code: editForm.employee_code,
          Name: editForm.Name,
          phone: editForm.phone,
          address: editForm.address,
          status: editForm.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editModal.employee.id)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('No rows updated. Check permissions or ID.');
        return;
      }

      // Type-cast the updated data
      const updatedEmployee = {
        ...data[0],
        status: data[0].status as 'active' | 'inactive'
      };

      setEmployees(prev => 
        prev.map(emp => emp.id === editModal.employee?.id ? updatedEmployee : emp)
      );
      setFilteredEmployees(prev => 
        prev.map(emp => emp.id === editModal.employee?.id ? updatedEmployee : emp)
      );
      
      toast.success('Employee updated successfully!');
      setEditModal({ open: false, employee: null });
      
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error?.message || 'Failed to update employee');
    } finally {
      setEditLoading(false);
    }
  };

  const openViewModal = (emp: EmployeeData) => {
    setViewModal({ open: true, employee: emp });
  };

  const openDeleteModal = (emp: EmployeeData) => {
    setDeleteModal({ open: true, employee: emp });
  };

  const handleDeleteEmployee = async () => {
    if (!deleteModal.employee) return;

    setDeleteLoading(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', deleteModal.employee.id);
        
      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== deleteModal.employee?.id));
      setFilteredEmployees(prev => prev.filter(emp => emp.id !== deleteModal.employee?.id));
      
      toast.success('Employee deleted successfully!');
      setDeleteModal({ open: false, employee: null });
      
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error(error?.message || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your organization's employees</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Employee Code *" 
              value={addForm.employee_code} 
              onChange={e => setAddForm(f => ({ ...f, employee_code: e.target.value }))} 
            />
            <Input 
              placeholder="Name *" 
              value={addForm.Name} 
              onChange={e => setAddForm(f => ({ ...f, Name: e.target.value }))} 
            />
            <Input 
              placeholder="Phone" 
              value={addForm.phone} 
              onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} 
            />
            <Input 
              placeholder="Address" 
              value={addForm.address} 
              onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} 
            />
            <select 
              value={addForm.status} 
              onChange={e => setAddForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleAddEmployee} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={editModal.open} onOpenChange={open => setEditModal({ open, employee: open ? editModal.employee : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Employee Code *" 
              value={editForm.employee_code} 
              onChange={e => setEditForm(f => ({ ...f, employee_code: e.target.value }))} 
            />
            <Input 
              placeholder="Name *" 
              value={editForm.Name} 
              onChange={e => setEditForm(f => ({ ...f, Name: e.target.value }))} 
            />
            <Input 
              placeholder="Phone" 
              value={editForm.phone} 
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} 
            />
            <Input 
              placeholder="Address" 
              value={editForm.address} 
              onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} 
            />
            <select 
              value={editForm.status} 
              onChange={e => setEditForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditModal({ open: false, employee: null })} variant="outline">Cancel</Button>
            <Button onClick={handleEditEmployee} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Details Modal */}
      <Dialog open={viewModal.open} onOpenChange={open => setViewModal({ open, employee: open ? viewModal.employee : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div><strong>Employee Code:</strong> {viewModal.employee?.employee_code}</div>
            <div><strong>Name:</strong> {viewModal.employee?.Name}</div>
            <div><strong>Phone:</strong> {viewModal.employee?.phone || 'N/A'}</div>
            <div><strong>Address:</strong> {viewModal.employee?.address || 'N/A'}</div>
            <div><strong>Status:</strong> {viewModal.employee?.status}</div>
            <div><strong>Created:</strong> {viewModal.employee?.created_at ? new Date(viewModal.employee.created_at).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Updated:</strong> {viewModal.employee?.updated_at ? new Date(viewModal.employee.updated_at).toLocaleDateString() : 'N/A'}</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewModal({ open: false, employee: null })} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={open => setDeleteModal({ open, employee: open ? deleteModal.employee : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete employee <strong>{deleteModal.employee?.Name}</strong> ({deleteModal.employee?.employee_code})?</p>
            <p className="text-red-600 text-sm mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setDeleteModal({ open: false, employee: null })} variant="outline">Cancel</Button>
            <Button onClick={handleDeleteEmployee} disabled={deleteLoading} variant="destructive">
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Employees</CardTitle>
          <CardDescription>
            Find employees by code, name, phone, or address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">All Employees ({filteredEmployees.length})</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or add a new employee.</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <Card key={emp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{emp.Name ? `${emp.Name} (${emp.employee_code})` : emp.employee_code}</CardTitle>
                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {emp.phone}
                    </div>
                  )}
                  {emp.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Address:</span> {emp.address}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openViewModal(emp)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditModal(emp)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(emp)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
