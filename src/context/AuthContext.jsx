import { createContext, useContext, useState } from "react";
import apiClient from "../api/axios";

export const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("logedInUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [userStatus, setUserStatus] = useState(() => {
    const stored = localStorage.getItem("userStatus");
    return stored ? JSON.parse(stored) : null;
  });

  // NEW: userLanguage state
  const [userLanguage, setUserLanguage] = useState(() => {
    const stored = localStorage.getItem("userLanguage");
    return stored ? JSON.parse(stored) : null;
  });

  // Helper function to save language preference
  const saveUserLanguage = (languageObject) => {
    if (languageObject && Object.keys(languageObject).length > 0) {
      localStorage.setItem("userLanguage", JSON.stringify(languageObject));
      setUserLanguage(languageObject);
    }
  };

  // 1. Login with status fetch (MODIFIED)
  const login = async (userData, authToken) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("logedInUser", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);

    // NEW: Save preferred language only if not already saved
    if (userData?.preferredLanguage) {
      saveUserLanguage(userData.preferredLanguage);
    }

    // Fetch initial status
    await fetchAndSaveUserStatus(userData.id, authToken);
  };

  // 2. Core function to fetch and save status
  const fetchAndSaveUserStatus = async (userId, authToken = token) => {
    try {
      if (!userId || !authToken) return null;

      const response = await apiClient.get(`/api/v1/status?userId=${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        const statusData = response.data.data;

        // Save to localStorage AND state
        localStorage.setItem("userStatus", JSON.stringify(statusData));
        setUserStatus(statusData);

        return statusData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user status:", error);
      return null;
    }
  };

  // NEW: Function to update language (complete replace)
  const updateUserLanguage = (newLanguageObject) => {
    if (newLanguageObject && Object.keys(newLanguageObject).length > 0) {
      saveUserLanguage(newLanguageObject);
      return true;
    }
    return false;
  };

  // 3. Manual refresh (subscription purchase ke baad call karo)
  const refreshUserStatus = async () => {
    if (user?.id && token) {
      console.log("Refreshing user status...");
      const newStatus = await fetchAndSaveUserStatus(user.id, token);

      if (newStatus) {
        console.log("User status updated successfully!");
        console.log(
          "Active subscriptions:",
          newStatus.activeSubscriptionsCount,
        );
      }

      return newStatus;
    }
    return null;
  };

  // 4. Logout (MODIFIED)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("logedInUser");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("userLanguage");
    // NOTE: userLanguage ko remove nahi karenge, taki language preference persist rahe
    setToken(null);
    setUser(null);
    setUserStatus(null);
    setUserLanguage(null);
    // NOTE: userLanguage state ko bhi clear nahi karenge
  };

  const value = {
    // Basic auth
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,

    // User status
    userStatus,

    // NEW: Language functionality
    userLanguage,
    updateUserLanguage, // Complete object replace karne ka function

    // IMPORTANT: Refresh function (subscription purchase ke baad call karna)
    refreshUserStatus,

    // Helper getters
    hasActiveSubscription: userStatus?.activeSubscriptionsCount > 0,
    isTrial: userStatus?.isTrial || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
