import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const AuthPage: React.FC = () => {
  const { login, isAuthenticated, employee } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(loginForm.email, loginForm.password);

      if (success) {
        toast.success('Login successful!');

        const waitForEmployee = async () => {
          let retries = 5;
          while (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200)); // Wait 200ms
            retries--;
          }

          switch (employee.role) {
            case 'admin':
              navigate('/dashboard');
              break;
            case 'employee':
              navigate('/employees');
              break;
            default:
              console.warn('Unrecognized role:', employee.role);
              break;
          }
        };

        // waitForEmployee();
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
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

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false); // Ensure loading state is reset
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (employee?.role) {
      switch (employee.role) {
        case 'admin':
          navigate('/dashboard');
          break;
        case 'employee':
          navigate('/employees');
          break;
        default:
          console.warn('Unrecognized role:', employee.role);
          break;
      }
    }
  }, [employee, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-lg shadow-md rounded-lg bg-white">
        <CardHeader className="text-center bg-gray-200 py-4 rounded-t-lg">
          <CardTitle className="text-2xl font-semibold text-gray-800">Welcome Back</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <Button type="submit" className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                className="text-sm text-gray-600 hover:underline focus:outline-none"
                onClick={() => setShowResetModal(true)}
              >
                Forgot password?
              </button>
            </div>
          </form>
          <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
            <DialogContent className="p-6 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-800">Reset Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <Button type="submit" className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700" disabled={resetLoading}>
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
