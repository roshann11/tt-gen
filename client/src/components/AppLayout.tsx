import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Users, DoorOpen, BookOpen, Clock,
  CalendarDays, Menu, X, LayoutDashboard, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const allNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "faculty"] },
  { to: "/faculty",   icon: Users,           label: "Faculty",   roles: ["admin", "faculty"] },
  { to: "/rooms",     icon: DoorOpen,        label: "Rooms",     roles: ["admin", "faculty"] },
  { to: "/subjects",  icon: BookOpen,        label: "Subjects",  roles: ["admin", "faculty"] },
  { to: "/timeslots", icon: Clock,           label: "Time Slots",roles: ["admin", "faculty"] },
  { to: "/timetable", icon: CalendarDays,    label: "Timetable", roles: ["admin", "faculty", "student"] },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const role = user?.role || "student";

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <GraduationCap className="h-7 w-7 text-[hsl(var(--sidebar-primary))]" />
          <span className="text-lg font-bold tracking-tight">TT Generator</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="text-xs text-[hsl(var(--sidebar-foreground))]/60 mb-2 px-3">
            Signed in as <strong>{user?.username}</strong> ({role})
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header + Sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold">TT Generator</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[hsl(var(--sidebar))] overflow-hidden"
            >
              <nav className="flex flex-col gap-1 px-3 py-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                          : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={() => { logout(); setSidebarOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[-1] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
