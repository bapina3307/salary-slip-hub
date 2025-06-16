
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';

interface AuthContextType {
  employee: Employee | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored auth data on app load
    const token = localStorage.getItem('token');
    const employeeData = localStorage.getItem('employee');
    
    if (token && employeeData) {
      setEmployee(JSON.parse(employeeData));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock API call - in real app, this would call your Node.js backend
      const mockEmployees = [
        { id: '1', email: 'admin@company.com', name: 'Admin User', role: 'admin' as const },
        { id: '2', email: 'john@company.com', name: 'John Doe', role: 'employee' as const, department: 'IT', position: 'Developer' },
        { id: '3', email: 'jane@company.com', name: 'Jane Smith', role: 'employee' as const, department: 'HR', position: 'Manager' }
      ];

      const foundEmployee = mockEmployees.find(emp => emp.email === email);
      
      if (foundEmployee && password === 'password123') {
        const token = 'mock-jwt-token-' + Date.now();
        localStorage.setItem('token', token);
        localStorage.setItem('employee', JSON.stringify(foundEmployee));
        setEmployee(foundEmployee);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Mock API call - in real app, this would call your Node.js backend
      const newEmployee = {
        id: Date.now().toString(),
        email,
        name,
        role: 'employee' as const,
        department: 'General',
        position: 'Employee'
      };

      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('employee', JSON.stringify(newEmployee));
      setEmployee(newEmployee);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    setEmployee(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ employee, login, signup, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
