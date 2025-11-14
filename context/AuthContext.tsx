import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api } from '../utils/api';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (allowedRoles: Role[]) => boolean;
  isAuthReady: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check for stored user and token on mount
    const initAuth = async () => {
      const storedUser = getFromLocalStorage<User>('currentUser');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        // Trust the stored token - it will be validated on first API call
        setCurrentUser(storedUser);
      }
      setIsAuthReady(true);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Sync currentUser to localStorage
    if (isAuthReady) {
      if (currentUser) {
        saveToLocalStorage('currentUser', currentUser);
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }, [currentUser, isAuthReady]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await api.login(email, password);
      
      if (result.error) {
        return { success: false, message: result.error };
      }

      if (result.data?.user) {
        const user = result.data.user as User;
        if (user.status === 'inactive') {
          api.logout();
          return { success: false, message: 'Your account has been deactivated. Please contact an administrator.' };
        }
        setCurrentUser(user);
        return { success: true };
      }

      return { success: false, message: 'Login failed. Please try again.' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'An error occurred during login.' };
    }
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const hasPermission = (allowedRoles: Role[]): boolean => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, hasPermission, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};