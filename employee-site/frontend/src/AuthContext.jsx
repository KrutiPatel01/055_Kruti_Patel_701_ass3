import { createContext, useContext, useState } from 'react';
import { api, setToken, clearToken, getToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(() => {
    const saved = localStorage.getItem('emp_info');
    return getToken() && saved ? JSON.parse(saved) : null;
  });

  async function login(empid, password) {
    const data = await api('/auth/login', { method: 'POST', body: { empid, password } });
    setToken(data.token);
    localStorage.setItem('emp_info', JSON.stringify(data.employee));
    setEmployee(data.employee);
  }

  function logout() {
    clearToken();
    localStorage.removeItem('emp_info');
    setEmployee(null);
  }

  return <AuthContext.Provider value={{ employee, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
