import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check if user is stored in localStorage on load
    const storedUser = localStorage.getItem('eventCrowdUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('eventCrowdUser', JSON.stringify(data));
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('eventCrowdUser', JSON.stringify(data));
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('eventCrowdUser');
    setUser(null);
  };

  // Helper to fetch authorization headers
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user?.token}`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
