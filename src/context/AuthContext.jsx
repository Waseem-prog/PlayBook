import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, usersApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const u = await authApi.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const u = await usersApi.updateProfile(data);
    setUser(u);
    return u;
  }, []);

  const refresh = useCallback(async () => setUser(await authApi.me()), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (user) => (user?.role === 'admin' ? '/admin' : '/student');
