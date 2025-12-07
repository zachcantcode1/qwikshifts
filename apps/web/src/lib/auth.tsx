import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@qwikshifts/core';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isOnboarded: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { onboarded } = await api.checkOnboardingStatus();
        setIsOnboarded(onboarded);

        const token = localStorage.getItem('qwikshifts-token');
        if (token) {
          try {
            const u = await api.getMe();
            setUser(u);
          } catch (e) {
            console.log('Failed to fetch user with token', e);
            localStorage.removeItem('qwikshifts-token');
          }
        }
      } catch (err) {
        console.error('Failed to check status', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string) => {
    const { user } = await api.login(email);
    setUser(user);
    window.location.reload(); // Simple reload to refresh app state
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isOnboarded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
