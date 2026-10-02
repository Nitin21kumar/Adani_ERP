import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { AuditAuthProvider } from "./contexts/AuditAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            {/* Independent from AuthProvider above — its own token storage and
                /audit/auth/me check, so an Employee ERP session and an Asset
                Audit Portal session can coexist in the same tab without
                interfering with each other. */}
            <AuditAuthProvider>
              <App />
              <Toaster richColors position="top-right" />
            </AuditAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
