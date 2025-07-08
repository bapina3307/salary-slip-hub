import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { supabase } from '../integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  employee: Employee | null;
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  isStaticAdmin?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStaticAdmin, setIsStaticAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.warn('No profile data found for user ID:', userId);
        return null;
      }

      if (!data.role) {
        console.warn('Role is missing in the fetched profile data for user ID:', userId);
      }

      // Type-safe conversion to Employee interface
      const employeeData: Employee = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as 'admin' | 'employee', // Type assertion for role
        department: data.department,
        position: data.position,
        join_date: data.join_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return employeeData;
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      if (session?.user) {
        if (!employee || employee.id !== session.user.id) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setEmployee(profile);
            setIsAuthenticated(true);
          }
        }
      } else {
        setEmployee(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        handleSession(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [employee]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          setEmployee(profile);
          setUser(data.user);
          setSession(data.session ?? null);
          setIsAuthenticated(true);
        }
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (user && user.id === '00000000-0000-0000-0000-000000000000') {
        setEmployee(null);
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setIsStaticAdmin(false);
        setLoading(false);
        return;
      }
      await supabase.auth.signOut();
      setEmployee(null);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setIsStaticAdmin(false);
      setLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id === '00000000-0000-0000-0000-000000000000') {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user && !employee) {
      setLoading(false);
    }
  }, [user, employee]);

  return (
    <AuthContext.Provider value={{ 
      employee, 
      user, 
      session, 
      login, 
      logout, 
      isAuthenticated, 
      loading,
      isStaticAdmin
    }}>
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
