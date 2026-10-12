import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useIsAdmin } from "./hooks/useIsAdmin";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Tokens from "./pages/Tokens";
import Questions from "./pages/Questions";
import Courses from "./pages/Courses";
import Users from "./pages/Users";
import Attempts from "./pages/Attempts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const isAdmin = useIsAdmin();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading…</div>
      </div>
    );
  }

  if (session && isAdmin) {
    return <Navigate to="/overview" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          {/* EVERY admin page must live inside this block */}
          <Route element={<AdminLayout />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/users" element={<Users />} />
            <Route path="/attempts" element={<Attempts />} />
          </Route>

          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}