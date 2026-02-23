import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Pencil, Trash2 } from "lucide-react";
import { getFaculty, createFaculty, updateFaculty, deleteFaculty } from "@/lib/api";
import DataPageShell from "@/components/DatapageShell";
import { toast } from "sonner";

export default function FacultyPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["faculty"], queryFn: getFaculty });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", department: "", shortName: "" });

  const createMut = useMutation({
    mutationFn: (d: any) => createFaculty(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faculty"] }); toast.success("Faculty added"); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => updateFaculty(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faculty"] }); toast.success("Faculty updated"); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFaculty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faculty"] }); toast.success("Faculty deleted"); },
  });

  function openDialog(item?: any) {
    if (item) {
      setEditing(item);
      setForm({ name: item.name || "", department: item.department || "", shortName: item.shortName || "" });
    } else {
      setEditing(null);
      setForm({ name: "", department: "", shortName: "" });
    }
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing._id, ...form });
    else createMut.mutate(form);
  }

  const items = Array.isArray(data) ? data : [];

  return (
    <DataPageShell title="Faculty" description="Manage faculty members" icon={<Users className="h-5 w-5" />} onAdd={() => openDialog()}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No faculty added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Short Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f: any) => (
                <tr key={f._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3">{f.shortName}</td>
                  <td className="px-4 py-3">{f.department}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDialog(f)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteMut.mutate(f._id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "Add"} Faculty</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Short Name</label>
                <input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  {editing ? "Update" : "Add"} Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DataPageShell>
  );
}
