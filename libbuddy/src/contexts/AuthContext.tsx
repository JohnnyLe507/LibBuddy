import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface AuthContextType {
  isLoggedIn: boolean;
  login: (accesstoken: string, refreshtoken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    localStorage.removeItem('accesstoken');
    localStorage.removeItem('refreshtoken');
    setIsLoggedIn(false);
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
  };

  const login = (accesstoken: string, refreshtoken: string) => {
    localStorage.setItem('accesstoken', accesstoken);
    localStorage.setItem('refreshtoken', refreshtoken);
    setIsLoggedIn(true);
    scheduleTokenRefresh(accesstoken);
  };

  const scheduleTokenRefresh = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      const expTime = decoded.exp * 1000;
      const refreshTime = expTime - Date.now() - 5000; // refresh 5s before expiry
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(refreshAccessToken, refreshTime);
    } catch {
      logout();
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshtoken = localStorage.getItem('refreshtoken');
      if (!refreshtoken) return logout();
      const response = await axios.post(`${API_BASE}/token`, {
        token: refreshtoken,
      });
      const newAccessToken = response.data.accesstoken;
      localStorage.setItem('accesstoken', newAccessToken);
      setIsLoggedIn(true);
      scheduleTokenRefresh(newAccessToken);
    } catch (error) {
      console.error('Failed to refresh access token', error);
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accesstoken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (!isExpired) {
          setIsLoggedIn(true);
          scheduleTokenRefresh(token);
        } else {
          refreshAccessToken(); // Try to refresh if expired
        }
      } catch {
        logout();
      }
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
