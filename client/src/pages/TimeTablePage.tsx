import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { generateTimetable, getTimetable } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const SLOT_COLORS = [
  "bg-[hsl(var(--timetable-blue))]",
  "bg-[hsl(var(--timetable-green))]",
  "bg-[hsl(var(--timetable-orange))]",
  "bg-[hsl(var(--timetable-purple))]",
  "bg-[hsl(var(--timetable-red))]",
  "bg-[hsl(var(--timetable-teal))]",
  "bg-[hsl(var(--timetable-pink))]",
  "bg-[hsl(var(--timetable-yellow))]",
];

function getColor(index: number) {
  return SLOT_COLORS[index % SLOT_COLORS.length];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["timetable"], queryFn: getTimetable });
  const [activeSem, setActiveSem] = useState("1");

  const genMut = useMutation({
    mutationFn: generateTimetable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Timetable generated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to generate timetable");
    },
  });

  // Backend returns { success, data: [{ semester, entries: [...] }] }
  const rawData = data?.data || data || [];
  const timetables = Array.isArray(rawData) ? rawData : [];
  const semesters = timetables.map((t: any) => String(t.semester)).sort();

  // Build grid from entries: { [day]: { [slotNumber]: entry } }
  function buildGrid(sem: string) {
    const tt = timetables.find((t: any) => String(t.semester) === sem);
    if (!tt || !Array.isArray(tt.entries)) return {};
    const grid: Record<string, Record<string, any>> = {};
    for (const entry of tt.entries) {
      const day = entry.day;
      const slot = entry.slotNumber;
      if (!day || slot == null) continue;
      if (!grid[day]) grid[day] = {};
      grid[day][String(slot)] = entry;
    }
    return grid;
  }

  // Get unique periods/slots
  function getPeriods() {
    const periods = new Set<number>();
    timetables.forEach((t: any) => {
      (t.entries || []).forEach((e: any) => {
        if (e.slotNumber != null) periods.add(Number(e.slotNumber));
      });
    });
    return Array.from(periods).sort((a, b) => a - b);
  }

  // Subject color map
  const subjectColorMap: Record<string, string> = {};
  let colorIdx = 0;
  timetables.forEach((t: any) => {
    (t.entries || []).forEach((e: any) => {
      const key = e.subject || "Unknown";
      if (!subjectColorMap[key]) {
        subjectColorMap[key] = getColor(colorIdx++);
      }
    });
  });

  const grid = buildGrid(activeSem);
  const periods = getPeriods();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timetable</h1>
            <p className="text-muted-foreground">Generate & view conflict-free schedules</p>
          </div>
        </div>
        <Button
          onClick={() => genMut.mutate()}
          disabled={genMut.isPending}
          className="gap-2"
          size="lg"
        >
          {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate Timetable
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
        {isLoading ? (
          <Card><CardContent className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>
        ) : semesters.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">No timetable generated yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add faculty, rooms, subjects, and time slots, then click Generate.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeSem} onValueChange={setActiveSem}>
            <TabsList>
              {semesters.sort().map((s) => (
                <TabsTrigger key={s} value={s}>Semester {s}</TabsTrigger>
              ))}
            </TabsList>

            {semesters.map((sem) => {
              const semGrid = buildGrid(sem);
              return (
                <TabsContent key={sem} value={sem}>
                  <Card>
                    <CardHeader><CardTitle>Semester {sem} Schedule</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      <table className="w-full min-w-[700px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left font-semibold text-muted-foreground">Day</th>
                            {periods.map((p) => (
                              <th key={p} className="p-3 text-center font-semibold text-muted-foreground">Period {p}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.map((day) => (
                            <tr key={day} className="border-b">
                              <td className="p-3 font-semibold">{day}</td>
                              {periods.map((p) => {
                                const entry = semGrid[day]?.[String(p)];
                                if (!entry) return <td key={p} className="p-2"><div className="h-16 rounded-lg bg-muted/30" /></td>;
                                const subName = entry.subject || "—";
                                const facName = entry.faculty || "";
                                const roomName = entry.room || "";
                                const color = subjectColorMap[subName] || "bg-muted";
                                return (
                                  <td key={p} className="p-2">
                                    <div className={`${color} flex h-16 flex-col items-center justify-center rounded-lg p-1 text-white shadow-sm`}>
                                      <span className="text-xs font-bold leading-tight">{subName}</span>
                                      {facName && <span className="mt-0.5 text-[10px] opacity-90">{facName}</span>}
                                      {roomName && <span className="text-[10px] opacity-80">{roomName}</span>}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}
