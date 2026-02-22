import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Users, DoorOpen, BookOpen, Clock,
  CalendarDays, Menu, X, LayoutDashboard,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/faculty", icon: Users, label: "Faculty" },
  { to: "/rooms", icon: DoorOpen, label: "Rooms" },
  { to: "/subjects", icon: BookOpen, label: "Subjects" },
  { to: "/timeslots", icon: Clock, label: "Time Slots" },
  { to: "/timetable", icon: CalendarDays, label: "Timetable" },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <GraduationCap className="h-8 w-8 text-sidebar-primary" />
          <h1 className="text-xl font-bold text-sidebar-primary font-display">TimeTable Pro</h1>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-6">
          <div className="rounded-lg bg-sidebar-accent p-4 text-center">
            <p className="text-xs text-sidebar-foreground/60">Academic Timetable Generator</p>
            <p className="mt-1 text-xs font-semibold text-sidebar-primary">v1.0</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6 lg:px-8">
          <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
