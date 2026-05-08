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
  const [form, setForm] = useState({ name: "", code: "", semester: "", credits: "", hasLab: true, lecturesPerWeek: "3", labsPerWeek: "1" });

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
      setForm({
        name: item.name || "",
        code: item.code || "",
        semester: String(item.semester || ""),
        credits: String(item.credits || ""),
        hasLab: item.hasLab ?? true,
        lecturesPerWeek: String(item.lecturesPerWeek ?? 3),
        labsPerWeek: String(item.labsPerWeek ?? 1),
      });
    } else {
      setEditing(null);
      setForm({ name: "", code: "", semester: "", credits: "", hasLab: true, lecturesPerWeek: "3", labsPerWeek: "1" });
    }
    setDialogOpen(true);
  }

  function closeDialog() { setDialogOpen(false); setEditing(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code,
      semester: Number(form.semester),
      credits: Number(form.credits),
      hasLab: form.hasLab,
      lecturesPerWeek: Number(form.lecturesPerWeek),
      labsPerWeek: form.hasLab ? Number(form.labsPerWeek) : 0,
    };
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lectures/Wk</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Has Lab</th>
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
                  <td className="px-4 py-3">{s.lecturesPerWeek ?? 3}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.hasLab
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {s.hasLab ? `✅ Yes (${s.labsPerWeek ?? 1}/wk)` : "❌ No"}
                    </span>
                  </td>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Lectures Per Week</label>
                  <input type="number" min="0" value={form.lecturesPerWeek} onChange={(e) => setForm({ ...form, lecturesPerWeek: e.target.value })} required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                {form.hasLab && (
                  <div>
                    <label className="text-sm font-medium">Labs Per Week</label>
                    <input type="number" min="0" value={form.labsPerWeek} onChange={(e) => setForm({ ...form, labsPerWeek: e.target.value })}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="hasLab"
                  checked={form.hasLab}
                  onChange={(e) => setForm({ ...form, hasLab: e.target.checked })}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <label htmlFor="hasLab" className="text-sm font-medium cursor-pointer select-none">
                  This subject has a lab component
                </label>
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
