import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "aos/dist/aos.css"; // Import AOS styles
import AOS from "aos";

import App from "./App.jsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { queryClient } from "./lib/react-query.js";
import { AuthProvider } from "./context/AuthContext.jsx";

AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: true, // Animation only once
  mirror: false,
  offset: 100,
});

createRoot(document.getElementById("root")).render(
  <MantineProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
    <ToastContainer />
  </MantineProvider>,
);
