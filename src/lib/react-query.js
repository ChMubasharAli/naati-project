// /lib/react-query.js
import { QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const queryErrorHandler = (error) => {
  const message = error.message || "An error occurred";
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showSuccessToast = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: queryErrorHandler,
    },
    mutations: {
      onError: queryErrorHandler,
    },
  },
});

// Query keys for better organization
export const queryKeys = {
  admin: {
    all: ["admin"],
    dashboard: () => [...queryKeys.admin.all, "dashboard"],
    users: () => [...queryKeys.admin.all, "users"],
  },
  auth: {
    all: ["auth"],
    profile: () => [...queryKeys.auth.all, "profile"],
    subscription: (userId) => [...queryKeys.auth.all, "subscription", userId],
    status: (userId) => [...queryKeys.auth.all, "status", userId], // Add this
  },
  languages: {
    all: ["languages"],
    list: () => [...queryKeys.languages.all, "list"],
    detail: (id) => [...queryKeys.languages.all, "detail", id],
  },
  domains: {
    all: ["domains"],
    list: () => [...queryKeys.domains.all, "list"],
    detail: (id) => [...queryKeys.domains.all, "detail", id],
  },
  dialogues: {
    all: ["dialogues"],
    list: () => [...queryKeys.dialogues.all, "list"],
    detail: (id) => [...queryKeys.dialogues.all, "detail", id],
  },
  segments: {
    all: ["segments"],
    list: (dialogueId) => [...queryKeys.segments.all, "list", dialogueId], // DialogueId include karein
    detail: (id) => [...queryKeys.segments.all, "detail", id],
  },

  users: {
    all: ["users"],
    list: () => [...queryKeys.users.all, "list"],
    detail: (id) => [...queryKeys.users.all, "detail", id],
  },
  transactions: {
    all: ["transactions"],
    list: () => [...queryKeys.transactions.all, "list"],
    detail: (id) => [...queryKeys.transactions.all, "detail", id],
  },

  mockTests: {
    all: ["mockTests"],
    lists: () => [...queryKeys.mockTests.all, "list"],
    list: () => [...queryKeys.mockTests.lists()],
    details: () => [...queryKeys.mockTests.all, "detail"],
    detail: (id) => [...queryKeys.mockTests.details(), id],
  },
  vocabulary: {
    all: ["vocabulary"],
    list: (filters = {}) => [...queryKeys.vocabulary.all, "list", filters],
    detail: (id) => [...queryKeys.vocabulary.all, "detail", id],
  },

  subscriptions: {
    all: ["subscriptions"],
    user: (userId) => [...queryKeys.subscriptions.all, "user", userId],
  },
};
