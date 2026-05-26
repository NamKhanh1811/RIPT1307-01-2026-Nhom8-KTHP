import { useState, useCallback } from 'react';
import { history } from '@umijs/max';
import { authService } from '@/services/auth';
import { storage } from '@/utils/helpers';
import type { User } from '@/types';

export default function useAuthModel() {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.success) {
        storage.setToken(res.data.token);
        storage.setUser(res.data.user);
        setCurrentUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    setCurrentUser(null);
    history.push('/login');
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authService.getMe().catch(() => null);
    if (res?.success) {
      storage.setUser(res.data);
      setCurrentUser(res.data);
    }
  }, []);

  const isStudent  = currentUser?.role === 'STUDENT';
  const isEmployer = currentUser?.role === 'EMPLOYER';
  const isAdmin    = currentUser?.role === 'ADMIN';

  return { currentUser, loading, isStudent, isEmployer, isAdmin, login, logout, refreshUser };
}
