import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { supabase } from '../integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  employee: Employee | null;
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role?: 'admin' | 'employee', employeeId?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  isStaticAdmin?: boolean; // Add flag
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
      if (error) throw error;
      console.log('Fetched profile:', data); // Debug log
      
      return data;
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isStaticAdmin) {
      setLoading(false);
      return; // Do not run Supabase auth listener for static admin
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          
          // Fetch profile data
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setEmployee(profile);
            setIsAuthenticated(true);
          }
        } else {
          setEmployee(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          if (profile) {
            setEmployee(profile);
            setSession(session);
            setUser(session.user);
            setIsAuthenticated(true);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isStaticAdmin]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Static admin credentials
    if (email === 'admin@gmail.com' && password === 'Admin@12') {
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@gmail.com',
        // ...add other User fields as needed or use type assertion
      } as User);
      setEmployee({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@gmail.com',
        name: 'Admin',
        role: 'admin',
        department: null,
        position: null,
        join_date: null,
        created_at: null,
        updated_at: null,
      });
      setIsAuthenticated(true);
      setIsStaticAdmin(true); // Set static admin flag
      setLoading(false);
      return true;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      // Fetch and set profile immediately after login for non-admin
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

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'employee' = 'employee', employeeId?: string): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        console.error('Signup error: Invalid email format');
        return false;
      }
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role
          }
        }
      });

      if (error || !data.user) {
        console.error('Signup error:', error);
        return false;
      }

      // Insert profile row after successful signup, including employee_id if provided
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: trimmedEmail,
          name,
          role,
          employee_id: employeeId || null
        }
      ]);
      if (profileError) {
        console.error('Profile insert error:', profileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading(true); // Start spinner for logout
      // For static admin, just clear state
      if (user && user.id === '00000000-0000-0000-0000-000000000000') {
        setEmployee(null);
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setIsStaticAdmin(false);
        setLoading(false); // Stop spinner
        return;
      }
      await supabase.auth.signOut();
      setEmployee(null);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setIsStaticAdmin(false);
      setLoading(false); // Stop spinner
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false); // Always stop spinner on error
    }
  };

  // In useEffect, if static admin is authenticated, set loading to false
  useEffect(() => {
    if (user && user.id === '00000000-0000-0000-0000-000000000000') {
      setLoading(false);
    }
  }, [user]);

  // In useEffect, always stop loading if user and employee are both null
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
      signup, 
      logout, 
      isAuthenticated, 
      loading,
      isStaticAdmin // Provide flag
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
