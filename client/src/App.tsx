import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/public/Home";
import { About } from "@/pages/public/About";
import { Register } from "@/pages/public/Register";
import { Login } from "@/pages/public/Login";
import { Vote } from "@/pages/public/Vote";
import { Results } from "@/pages/public/Results";
import { ComingSoon } from "@/pages/public/ComingSoon";
import { NotFound } from "@/pages/NotFound";
import { StudentDashboard } from "@/pages/student/Dashboard";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { JudgePortal } from "@/pages/judge/Portal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="blog" element={<ComingSoon title="News & Updates" />} />
              <Route path="blog/:slug" element={<ComingSoon title="News & Updates" />} />
              <Route path="gallery" element={<ComingSoon title="Gallery" />} />
              <Route path="contact" element={<ComingSoon title="Contact Us" />} />
              <Route path="vote" element={<Vote />} />
              <Route path="results" element={<Results />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute roles={["STUDENT"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="judge"
                element={
                  <ProtectedRoute roles={["JUDGE"]}>
                    <JudgePortal />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
