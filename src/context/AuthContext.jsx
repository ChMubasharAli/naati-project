import { createContext, useContext, useState } from "react";

export const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // Initialize directly in useState
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("logedInUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // 1. Login
  const login = (userData, authToken) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("logedInUser", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  // 3. Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("logedInUser");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
