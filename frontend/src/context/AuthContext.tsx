import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRoleEnum } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  hasRole: (role: UserRoleEnum | string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (identifier: string, pass: string, selectedRole?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ identifier, password: pass, selectedRole });
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const switchRole = async (newRole: string) => {
    if (!user || !user.roles.includes(newRole)) return;
    setUser({ ...user, activeRole: newRole });
  };

  const hasRole = (role: UserRoleEnum | string) => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    if (user.roles.includes(UserRoleEnum.SUPER_ADMIN)) return true;
    return user.permissions?.includes(permissionCode) || false;
  };

  const refreshUserData = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        logoutAll,
        switchRole,
        hasRole,
        hasPermission,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
