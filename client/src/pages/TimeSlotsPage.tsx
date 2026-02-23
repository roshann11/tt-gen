import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from "@/lib/api";
import DataPageShell from "@/components/DatapageShell";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimeSlotsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["timeslots"], queryFn: getTimeSlots });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ day: "Monday", startTime: "", endTime: "", period: "" });

  const createMut = useMutation({
    mutationFn: (d: any) => createTimeSlot(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timeslots"] }); toast.success("Time slot added"); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => updateTimeSlot(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timeslots"] }); toast.success("Time slot updated"); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTimeSlot(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timeslots"] }); toast.success("Time slot deleted"); },
  });

  function openDialog(item?: any) {
    if (item) {
      setEditing(item);
      setForm({ day: item.day || "Monday", startTime: item.startTime || "", endTime: item.endTime || "", period: String(item.period || "") });
    } else {
      setEditing(null);
      setForm({ day: "Monday", startTime: "", endTime: "", period: "" });
    }
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { day: form.day, startTime: form.startTime, endTime: form.endTime, period: Number(form.period) };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  }

  const items = Array.isArray(data) ? data : [];

  return (
    <DataPageShell title="Time Slots" description="Define periods for each day" icon={<Clock className="h-5 w-5" />} onAdd={() => openDialog()}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No time slots added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Day</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Start Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">End Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => (
                <tr key={t._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.day}</td>
                  <td className="px-4 py-3">{t.period}</td>
                  <td className="px-4 py-3">{t.startTime}</td>
                  <td className="px-4 py-3">{t.endTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDialog(t)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteMut.mutate(t._id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "Add"} Time Slot</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Day</label>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Period Number</label>
                <input type="number" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  {editing ? "Update" : "Add"} Time Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DataPageShell>
  );
}
