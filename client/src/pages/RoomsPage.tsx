import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Pencil, Trash2 } from "lucide-react";
import { getRooms, createRoom, updateRoom, deleteRoom } from "@/lib/api";
import DataPageShell from "@/components/DatapageShell";
import { toast } from "sonner";

export default function RoomsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["rooms"], queryFn: getRooms });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", capacity: "" });

  const createMut = useMutation({
    mutationFn: (d: any) => createRoom(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room added"); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => updateRoom(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room updated"); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rooms"] }); toast.success("Room deleted"); },
  });

  function openDialog(item?: any) {
    if (item) {
      setEditing(item);
      setForm({ name: item.name || "", capacity: String(item.capacity || "") });
    } else {
      setEditing(null);
      setForm({ name: "", capacity: "" });
    }
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, capacity: Number(form.capacity) };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  }

  const items = Array.isArray(data) ? data : [];

  return (
    <DataPageShell title="Rooms" description="Manage classrooms and labs" icon={<DoorOpen className="h-5 w-5" />} onAdd={() => openDialog()}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No rooms added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Room Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Capacity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r: any) => (
                <tr key={r._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.capacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDialog(r)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteMut.mutate(r._id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "Add"} Room</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Room Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  {editing ? "Update" : "Add"} Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DataPageShell>
  );
}
