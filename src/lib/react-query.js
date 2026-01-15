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
  auth: {
    all: ["auth"],
    profile: () => [...queryKeys.auth.all, "profile"],
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
    list: () => [...queryKeys.segments.all, "list"],
    detail: (id) => [...queryKeys.segments.all, "detail", id],
  },
  users: {
    all: ["users"],
    list: () => [...queryKeys.users.all, "list"],
    detail: (id) => [...queryKeys.users.all, "detail", id],
  },
};
