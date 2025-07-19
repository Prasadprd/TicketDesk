import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage or validate token
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/profile')
        .then(res => {
          console.log('User loaded from token:', res.data);
          setUser(res.data);
          console.log("User from authcontext", res.data);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    console.log('User logged in:', userData);
    console.log('Token:', token);
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = user;
  console.log("User is authenticated:", isAuthenticated);
  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
