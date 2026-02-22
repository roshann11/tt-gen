import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, DoorOpen, BookOpen, Clock, CalendarDays, AlertCircle } from "lucide-react";
import { getFaculty, getRooms, getSubjects, getTimeSlots } from "@/lib/api";

const statCards = [
  { key: "faculty", label: "Faculty", icon: Users, color: "bg-primary" },
  { key: "rooms", label: "Rooms", icon: DoorOpen, color: "bg-accent" },
  { key: "subjects", label: "Subjects", icon: BookOpen, color: "bg-secondary" },
  { key: "timeslots", label: "Time Slots", icon: Clock, color: "bg-destructive" },
];

export default function Dashboard() {
  const faculty = useQuery({ queryKey: ["faculty"], queryFn: getFaculty });
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: getRooms });
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const timeslots = useQuery({ queryKey: ["timeslots"], queryFn: getTimeSlots });

  const counts: Record<string, number> = {
    faculty: Array.isArray(faculty.data) ? faculty.data.length : 0,
    rooms: Array.isArray(rooms.data) ? rooms.data.length : 0,
    subjects: Array.isArray(subjects.data) ? subjects.data.length : 0,
    timeslots: Array.isArray(timeslots.data) ? timeslots.data.length : 0,
  };

  const isAnyError = faculty.isError || rooms.isError || subjects.isError || timeslots.isError;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage your academic timetable data</p>
      </motion.div>

      {isAnyError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Cannot reach backend at <code className="rounded bg-destructive/10 px-1">localhost:5000</code>. Make sure your server is running.
          </p>
        </motion.div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <div className={`rounded-lg p-2 ${card.color} text-primary-foreground`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{counts[card.key]}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-primary" /> Quick Start Guide
          </h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 text-muted-foreground">
            <li>Add <strong className="text-foreground">Faculty</strong> members with their names and departments</li>
            <li>Create <strong className="text-foreground">Rooms</strong> with capacities</li>
            <li>Define <strong className="text-foreground">Subjects</strong> with semester and credit info</li>
            <li>Set up <strong className="text-foreground">Time Slots</strong> for each day</li>
            <li>Go to <strong className="text-foreground">Timetable</strong> and generate your schedule!</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}
