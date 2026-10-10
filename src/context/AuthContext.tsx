import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { AuthService, AuthResponse } from '../lib/auth.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthResponse>;
  loginAsDemo: (name?: string, building?: string) => AuthResponse;
  signup: (
    name: string,
    email: string,
    building: string,
    pass: string,
    confirmPass: string,
    agreeTerms: boolean
  ) => Promise<AuthResponse>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: (hasUnsavedWork?: boolean) => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  isLogoutModalOpen: boolean;
  updateProfile: (name: string, building: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if session exists on boot
    const existing = AuthService.getCurrentUser();
    setUser(existing);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, remember: boolean): Promise<AuthResponse> => {
    const res = await AuthService.login(email, password, remember);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const loginAsDemo = (name?: string, building?: string): AuthResponse => {
    const res = AuthService.loginAsDemo(name, building);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const signup = async (
    name: string,
    email: string,
    building: string,
    pass: string,
    confirmPass: string,
    agreeTerms: boolean
  ): Promise<AuthResponse> => {
    const res = await AuthService.signup(name, email, building, pass, confirmPass, agreeTerms);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const requestPasswordReset = async (email: string) => {
    return AuthService.requestPasswordReset(email);
  };

  const logout = (hasUnsavedWork: boolean = false) => {
    if (hasUnsavedWork) {
      setIsLogoutModalOpen(true);
    } else {
      AuthService.logout();
      setUser(null);
    }
  };

  const confirmLogout = () => {
    AuthService.logout();
    setUser(null);
    setIsLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const updateProfile = (name: string, building: string) => {
    const updated = AuthService.updateProfile(name, building);
    if (updated) {
      setUser({ ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        signup,
        requestPasswordReset,
        logout,
        confirmLogout,
        cancelLogout,
        isLogoutModalOpen,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
