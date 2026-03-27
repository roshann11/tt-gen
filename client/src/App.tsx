// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "sonner";
// import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// import LoginPage from "@/pages/LoginPage";
// import Dashboard from "@/pages/Dashboard";
// import ImportData from "@/pages/ImportData";
// import TimetablePage from "@/pages/TimeTablePage";
// import NotFound from "@/pages/NotFound";

// const queryClient = new QueryClient();

// // ── Protected Route wrapper ──
// function ProtectedRoute({
//   children,
//   allowed,
// }: {
//   children: React.ReactNode;
//   allowed: string[];
// }) {
//   const { user } = useAuth();

//   if (!user) return <Navigate to="/login" replace />;
//   if (!allowed.includes(user.role)) return <Navigate to="/" replace />;

//   return <>{children}</>;
// }

// // ── Root redirect based on role ──
// function RootRedirect() {
//   const { user } = useAuth();
//   if (!user) return <Navigate to="/login" replace />;
//   if (user.role === "student") return <Navigate to="/timetable" replace />;
//   return <Navigate to="/dashboard" replace />;
// }

// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/" element={<RootRedirect />} />

//       {/* Admin + Faculty */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute allowed={["admin", "faculty"]}>
//             <Dashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/import"
//         element={
//           <ProtectedRoute allowed={["admin", "faculty"]}>
//             <ImportData />
//           </ProtectedRoute>
//         }
//       />

//       {/* Admin only */}
//       <Route
//         path="/manage-users"
//         element={
//           <ProtectedRoute allowed={["admin"]}>
//             <Dashboard /> {/* Replace with UserManagement page when ready */}
//           </ProtectedRoute>
//         }
//       />

//       {/* All authenticated users */}
//       <Route
//         path="/timetable"
//         element={
//           <ProtectedRoute allowed={["admin", "faculty", "student"]}>
//             <TimetablePage />
//           </ProtectedRoute>
//         }
//       />

//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <BrowserRouter>
//         <AuthProvider>
//           <Toaster richColors position="top-right" />
//           <AppRoutes />
//         </AuthProvider>
//       </BrowserRouter>
//     </QueryClientProvider>
//   );
// }


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ImportData from "@/pages/ImportData";
import TimetablePage from "@/pages/TimeTablePage";
import FacultyPages from "@/pages/FacultyPages";
import RoomsPage from "@/pages/RoomsPage";
import SubjectsPage from "@/pages/SubjectsPage";
import TimeSlotsPage from "@/pages/TimeSlotsPage";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === "student") return <Navigate to="/timetable" />;
  return <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* All authenticated routes wrapped in AppLayout (sidebar) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin + Faculty */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <FacultyPages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subjects"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeslots"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty"]}>
              <TimeSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ImportData />
            </ProtectedRoute>
          }
        />

        {/* All roles */}
        <Route path="/timetable" element={<TimetablePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

