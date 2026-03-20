import { Toaster } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import FacultyPage from "@/pages/FacultyPages";
import RoomsPage from "@/pages/RoomsPage";
import SubjectsPage from "@/pages/SubjectsPage";
import TimeSlotsPage from "@/pages/TimeSlotsPage";
import TimetablePage from "@/pages/TimeTablePage";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import Index from "./pages/Index";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            {/* Student, Faculty, Admin can view timetable */}
            {/* { <Route path="/timetable" element={
              <ProtectedRoute allowedRoles={["student", "faculty", "admin"]}>
                <TimetablePage />
              </ProtectedRoute>
            } /> }
            {/* Faculty + Admin can manage rooms/subjects/slots */}
            {/* { <Route path="/rooms" element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <RoomsPage />
              </ProtectedRoute>
            } /> } */}
            {/* Admin only routes */}
            {/* { <Route path="/manage-users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageUsersPage />
              </ProtectedRoute>
            } /> }  */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
