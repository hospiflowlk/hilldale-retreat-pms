import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/apiClient';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLocked: boolean;
  login: (username: string, pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  logout: () => void;
  resetTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLocked, setIsLocked] = useState<boolean>(!token);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timeout from settings, default 15 mins
  const [timeoutMs, setTimeoutMs] = useState(15 * 60 * 1000); 

  useEffect(() => {
    // Fetch settings on mount
    apiClient.get('/auth/settings').then(res => {
      if (res.data.inactivity_timeout_minutes) {
        setTimeoutMs(res.data.inactivity_timeout_minutes * 60 * 1000);
      }
    }).catch(console.error);
  }, []);

  const lock = () => {
    setIsLocked(true);
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user && !isLocked) {
      timeoutRef.current = setTimeout(lock, timeoutMs);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user, isLocked, timeoutMs]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      apiClient.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setIsLocked(false);
          resetTimer();
        })
        .catch(() => {
          logout();
        });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = async (username: string, pin: string) => {
    const res = await apiClient.post('/auth/login', { username, pin });
    setToken(res.data.token);
    setUser(res.data.user);
    setIsLocked(false);
  };

  const unlock = async (pin: string) => {
    if (user) {
      await login(user.username, pin); // Re-auth to unlock
    }
  };

  const logout = () => {
    setToken(null);
    setIsLocked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLocked, login, unlock, logout, resetTimer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
