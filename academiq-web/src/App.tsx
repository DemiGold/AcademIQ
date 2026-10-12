import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import PublicLayout from "./components/layout/PublicLayout";
import StudentLayout from "./components/layout/StudentLayout";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./features/auth";
import DashboardPage from "./features/dashboard/DashboardPage";
import CourseDetailPage from "./features/courses/CourseDetailPage";
import CoursesListPage from "./features/courses/CoursesListPage";
import QuizPage from "./features/quiz/QuizPage";
import ResultPage from "./features/quiz/ResultPage";
import CGPACalculatorPage from "./features/cgpa/CGPACalculatorPage";
import ProfilePage from "./features/profile/ProfilePage";
import LandingPage from "./features/landing/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * Auth-only guard. Renders children full-screen (no tab bar).
 * Used for quiz pages which need the entire viewport.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading…</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

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
          {/* Public routes — no auth */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Student routes — auth required, tab bar */}
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesListPage />} />
            <Route path="/courses/:code" element={<CourseDetailPage />} />
            <Route path="/cgpa" element={<CGPACalculatorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Quiz routes — auth required, FULL-SCREEN (no tab bar) */}
          <Route
            path="/quiz/:code"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:code/result"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}