import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { generateTimetable, getTimetable } from "@/lib/api";
import { toast } from "sonner";

const SLOT_COLORS = [
  "bg-primary/15 text-primary border-primary/30",
  "bg-accent/15 text-accent border-accent/30",
  "bg-secondary/15 text-secondary-foreground border-secondary/30",
  "bg-destructive/15 text-destructive border-destructive/30",
  "bg-primary/10 text-primary border-primary/20",
];

export default function TimetablePage() {
  const [generated, setGenerated] = useState(false);

  const { data: timetable, isLoading, refetch } = useQuery({
    queryKey: ["timetable"],
    queryFn: getTimetable,
    enabled: generated,
  });

  const generateMut = useMutation({
    mutationFn: generateTimetable,
    onSuccess: () => {
      setGenerated(true);
      refetch();
      toast.success("Timetable generated successfully!");
    },
    onError: () => toast.error("Failed to generate timetable"),
  });

  const entries = Array.isArray(timetable) ? timetable : [];

  // Group by semester -> day -> period
  const grouped: Record<number, Record<string, any[]>> = {};
  entries.forEach((entry: any) => {
    const sem = entry.semester || entry.subject?.semester || 1;
    const day = entry.day || entry.timeSlot?.day || "Monday";
    if (!grouped[sem]) grouped[sem] = {};
    if (!grouped[sem][day]) grouped[sem][day] = [];
    grouped[sem][day].push(entry);
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timetable</h1>
            <p className="text-muted-foreground">Generate and view your academic schedule</p>
          </div>
        </div>
        <button
          onClick={() => generateMut.mutate()}
          disabled={generateMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Generate Timetable
        </button>
      </motion.div>

      {!generated && entries.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 text-center">
          <CalendarDays className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-xl font-semibold text-muted-foreground">No timetable generated yet</h2>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Add faculty, rooms, subjects, and time slots first, then click "Generate Timetable"
          </p>
        </motion.div>
      )}

      {isLoading && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((sem) => (
        <motion.div key={sem} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <h2 className="text-xl font-bold mb-4">Semester {sem}</h2>
          <div className="rounded-xl border bg-card shadow-sm overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Day</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Faculty</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Room</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) =>
                  (grouped[Number(sem)][day] || [])
                    .sort((a: any, b: any) => (a.timeSlot?.period || a.period || 0) - (b.timeSlot?.period || b.period || 0))
                    .map((entry: any, idx: number) => (
                      <tr key={`${day}-${idx}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{day}</td>
                        <td className="px-4 py-3">{entry.timeSlot?.period || entry.period}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${SLOT_COLORS[idx % SLOT_COLORS.length]}`}>
                            {entry.subject?.name || entry.subjectName || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{entry.faculty?.name || entry.facultyName || "—"}</td>
                        <td className="px-4 py-3">{entry.room?.name || entry.roomName || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {entry.timeSlot?.startTime || entry.startTime || ""} - {entry.timeSlot?.endTime || entry.endTime || ""}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
