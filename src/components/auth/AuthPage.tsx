import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const AuthPage: React.FC = () => {
  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    employeeCode: ''
  });

  const [employees, setEmployees] = useState<{ id: string; Name: string; employee_code: string }[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const fetchEmployees = async () => {
    try {
      // Fetch employees with a more permissive query approach
      const { data, error } = await supabase
        .from('employees')
        .select('id, Name, employee_code')
        .order('Name', { ascending: true });
      
      if (error) {
        console.error('Error fetching employees:', error);
        // If RLS blocks this, try without authentication context
        console.log('Attempting to fetch employees without RLS context...');
        return;
      }
      
      console.log('Fetched employees:', data);
      if (data) setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'signup') {
      fetchEmployees();
    }
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
 
    try {
      const success = await login(loginForm.email, loginForm.password);
       
      if (success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials. Try: admin@gmail.com / Admin@12');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!signupForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    setIsLoading(true);
    try {
      const selectedEmployee = employees.find(emp => emp.id === signupForm.employeeId);
      if (!selectedEmployee) {
        toast.error('Selected employee not found.');
        setIsLoading(false);
        return;
      }
      
      const success = await signup(signupForm.email, signupForm.password, selectedEmployee.Name || '');
      if (!success) {
        toast.error('Failed to create account');
        setIsLoading(false);
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Could not get user after signup');
        setIsLoading(false);
        return;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ employee_id: selectedEmployee.id })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the signup for this error, just log it
      }
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      toast.success('Password reset email sent! Check your inbox.');
      setShowResetModal(false);
      setResetEmail('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Employee Portal</CardTitle>
          <CardDescription>
            Access your employee dashboard and salary information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500"></span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline focus:outline-none"
                    onClick={() => setShowResetModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
              <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={resetLoading}>
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-employee">Employee Name</Label>
                  <select
                    id="signup-employee"
                    className="w-full border rounded px-3 py-2"
                    value={signupForm.employeeId}
                    onChange={e => {
                      const selected = employees.find(emp => emp.id === e.target.value);
                      setSignupForm({
                        ...signupForm,
                        employeeId: e.target.value,
                        employeeCode: selected?.employee_code || ''
                      });
                    }}
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.Name}</option>
                    ))}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-sm text-yellow-600">
                      No employees found. Please contact administrator.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
