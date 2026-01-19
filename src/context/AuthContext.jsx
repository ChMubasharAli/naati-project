import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../api/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/react-query";

export const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Initialize directly in useState
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("logedInUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // React Query se subscription fetch karo
  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: queryKeys.auth.subscription(user?.id),
    queryFn: async () => {
      if (!user?.id || !token) return null;

      try {
        const response = await apiClient.get(
          `/api/v1/subscriptions/status/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
    },
    enabled: !!user?.id && !!token && user?.role === "user", // Sirf user role ke liye
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Extract subscription from data
  const subscription = subscriptionData?.subscription;

  // 1. Login (with subscription fetch ONLY for users)
  const login = async (userData, authToken) => {
    // Pehle user aur token save karo
    localStorage.setItem("token", authToken);
    localStorage.setItem("logedInUser", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);

    // React Query automatically fetch karega subscription
    // Agar user "user" role ka hai
  };

  // 2. Manual refresh function (for after subscription purchase)
  const refreshSubscriptionStatus = useCallback(async () => {
    if (user?.role === "user") {
      // React Query cache invalidate karo aur dobara fetch karo
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.subscription(user.id),
      });
      await refetchSubscription();

      // Agar subscription active hai to localStorage se freeTestUsed remove karo
      if (subscription?.isSubscription && subscription?.status === "active") {
        localStorage.removeItem(`freeTestUsed_${user.id}`);
      }

      return subscriptionData;
    }
    return null;
  }, [user, queryClient, refetchSubscription, subscription, subscriptionData]);

  // 3. Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("logedInUser");
    localStorage.removeItem("userSubscription");
    queryClient.removeQueries({
      queryKey: queryKeys.auth.subscription(user?.id),
    });
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    subscription,
    login,
    logout,
    refreshSubscriptionStatus,
    refetchSubscription,
    isAuthenticated: !!user && !!token,
    hasActiveSubscription:
      user?.role === "user" &&
      subscription?.isSubscription &&
      subscription?.status === "active",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
