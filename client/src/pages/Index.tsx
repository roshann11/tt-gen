import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Redirect based on role
  if (user.role === "student") return <Navigate to="/timetable" replace />;
  return <Navigate to="/dashboard" replace />;
}
