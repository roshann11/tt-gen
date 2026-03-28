import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, DoorOpen, BookOpen, Clock, AlertCircle } from "lucide-react";
import { getFaculty, getRooms, getSubjects, getTimeSlots } from "@/lib/api";

const statCards = [
  { key: "faculty",   label: "Faculty",    icon: Users,    color: "bg-primary" },
  { key: "rooms",     label: "Rooms",      icon: DoorOpen, color: "bg-accent" },
  { key: "subjects",  label: "Subjects",   icon: BookOpen, color: "bg-secondary" },
  { key: "timeslots", label: "Time Slots", icon: Clock,    color: "bg-destructive" },
];

// Helper: extract array from response (handles both raw array and { data: [...] } wrapper)
function extractArray(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

export default function Dashboard() {
  const faculty   = useQuery({ queryKey: ["faculty"],   queryFn: getFaculty });
  const rooms     = useQuery({ queryKey: ["rooms"],     queryFn: getRooms });
  const subjects  = useQuery({ queryKey: ["subjects"],  queryFn: getSubjects });
  const timeslots = useQuery({ queryKey: ["timeslots"], queryFn: getTimeSlots });

  const counts: Record<string, number> = {
    faculty:   extractArray(faculty.data).length,
    rooms:     extractArray(rooms.data).length,
    subjects:  extractArray(subjects.data).length,
    timeslots: extractArray(timeslots.data).length,
  };

  const isAnyError = faculty.isError || rooms.isError || subjects.isError || timeslots.isError;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your academic timetable data</p>
      </div>

      {isAnyError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Cannot reach backend at <code>localhost:5000</code>. Make sure your server is running.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              <div className={`${card.color} text-primary-foreground p-2 rounded-lg`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mt-3 text-foreground">{counts[card.key]}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Start Guide</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Add <strong>Faculty</strong> members with their names and departments</li>
          <li>Create <strong>Rooms</strong> with capacities</li>
          <li>Define <strong>Subjects</strong> with semester and credit info</li>
          <li>Set up <strong>Time Slots</strong> for each day</li>
          <li>Go to <strong>Timetable</strong> and generate your schedule!</li>
        </ol>
      </div>
    </div>
  );
}
