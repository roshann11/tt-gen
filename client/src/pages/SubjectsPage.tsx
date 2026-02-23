import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/lib/api";
import DataPageShell from "@/components/DatapageShell";
import { toast } from "sonner";

export default function SubjectsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", semester: "", credits: "" });

  const createMut = useMutation({
    mutationFn: (d: any) => createSubject(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject added"); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => updateSubject(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject updated"); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject deleted"); },
  });

  function openDialog(item?: any) {
    if (item) {
      setEditing(item);
      setForm({ name: item.name || "", code: item.code || "", semester: String(item.semester || ""), credits: String(item.credits || "") });
    } else {
      setEditing(null);
      setForm({ name: "", code: "", semester: "", credits: "" });
    }
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: form.name, code: form.code, semester: Number(form.semester), credits: Number(form.credits) };
    if (editing) updateMut.mutate({ id: editing._id, ...payload });
    else createMut.mutate(payload);
  }

  const items = Array.isArray(data) ? data : [];

  return (
    <DataPageShell title="Subjects" description="Manage course subjects" icon={<BookOpen className="h-5 w-5" />} onAdd={() => openDialog()}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No subjects added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Semester</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s: any) => (
                <tr key={s._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.code}</td>
                  <td className="px-4 py-3">{s.semester}</td>
                  <td className="px-4 py-3">{s.credits}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openDialog(s)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteMut.mutate(s._id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit" : "Add"} Subject</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Semester</label>
                  <input type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Credits</label>
                  <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm rounded-md border hover:bg-muted">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  {editing ? "Update" : "Add"} Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DataPageShell>
  );
}
