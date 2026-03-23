import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Plus, Loader2 } from "lucide-react";
import api from "@/lib/api";

// ── Generic CRUD helpers ──
function useCollection<T extends { _id: string }>(endpoint: string) {
  const qc = useQueryClient();
  const query = useQuery<T[]>({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await api.get(endpoint);
      const d = res.data?.data ?? res.data;
      return Array.isArray(d) ? d : [];
    },
  });

  const createMut = useMutation({
    mutationFn: (body: Partial<T>) => api.post(endpoint, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      toast.success("Item added");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to add"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      toast.success("Item deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete"),
  });

  const importMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post(`${endpoint}/import`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      toast.success("CSV imported");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Import failed"),
  });

  return { ...query, createMut, deleteMut, importMut };
}

// ── CSV upload button ──
function CsvUpload({ onUpload, loading }: { onUpload: (f: File) => void; loading: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
        className="max-w-xs"
      />
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}

// ── Faculty Tab ──
function FacultyTab() {
  const { data = [], isLoading, createMut, deleteMut, importMut } = useCollection<any>("/faculty");
  const [form, setForm] = useState({ name: "", shortName: "", department: "", subjects: "" });

  const handleAdd = () => {
    if (!form.name || !form.shortName) return toast.error("Name and Short Name required");
    createMut.mutate({
      name: form.name,
      shortName: form.shortName,
      department: form.department,
      subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setForm({ name: "", shortName: "", department: "", subjects: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty</CardTitle>
        <CardDescription>Add faculty members or import from CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CsvUpload onUpload={(f) => importMut.mutate(f)} loading={importMut.isPending} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Short Name</Label><Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div><Label>Subjects (comma-sep codes)</Label><Input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} /></div>
        </div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4 mr-1" />Add Faculty</Button>

        {isLoading ? <Loader2 className="animate-spin" /> : (
          <div className="border rounded-md overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Name</th><th className="p-2">Short</th><th className="p-2">Dept</th><th className="p-2">Subjects</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {data.map((f: any) => (
                  <tr key={f._id} className="border-t">
                    <td className="p-2">{f.name}</td>
                    <td className="p-2 text-center">{f.shortName}</td>
                    <td className="p-2 text-center">{f.department}</td>
                    <td className="p-2 text-center">{(f.subjects || []).join(", ")}</td>
                    <td className="p-2 text-center"><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(f._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Rooms Tab ──
function RoomsTab() {
  const { data = [], isLoading, createMut, deleteMut, importMut } = useCollection<any>("/rooms");
  const [form, setForm] = useState({ name: "", type: "lecture", capacity: "" });

  const handleAdd = () => {
    if (!form.name) return toast.error("Room name required");
    createMut.mutate({ name: form.name, type: form.type, capacity: Number(form.capacity) || 60 });
    setForm({ name: "", type: "lecture", capacity: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rooms</CardTitle>
        <CardDescription>Add rooms (lecture or lab) or import from CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CsvUpload onUpload={(f) => importMut.mutate(f)} loading={importMut.isPending} />
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Room Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div>
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
            </select>
          </div>
          <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
        </div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4 mr-1" />Add Room</Button>

        {isLoading ? <Loader2 className="animate-spin" /> : (
          <div className="border rounded-md overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Name</th><th className="p-2">Type</th><th className="p-2">Capacity</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {data.map((r: any) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-center">{r.type}</td>
                    <td className="p-2 text-center">{r.capacity}</td>
                    <td className="p-2 text-center"><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(r._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Subjects Tab ──
function SubjectsTab() {
  const { data = [], isLoading, createMut, deleteMut, importMut } = useCollection<any>("/subjects");
  const [form, setForm] = useState({ code: "", name: "", semester: "", lecturesPerWeek: "3", labsPerWeek: "1", hasLab: true });

  const handleAdd = () => {
    if (!form.code || !form.name || !form.semester) return toast.error("Code, Name, and Semester required");
    createMut.mutate({
      code: form.code, name: form.name, semester: Number(form.semester),
      lecturesPerWeek: Number(form.lecturesPerWeek), labsPerWeek: Number(form.labsPerWeek), hasLab: form.hasLab,
    });
    setForm({ code: "", name: "", semester: "", lecturesPerWeek: "3", labsPerWeek: "1", hasLab: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subjects</CardTitle>
        <CardDescription>Add subjects or import from CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CsvUpload onUpload={(f) => importMut.mutate(f)} loading={importMut.isPending} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Semester</Label><Input type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
          <div><Label>Lectures/Week</Label><Input type="number" value={form.lecturesPerWeek} onChange={(e) => setForm({ ...form, lecturesPerWeek: e.target.value })} /></div>
          <div><Label>Labs/Week</Label><Input type="number" value={form.labsPerWeek} onChange={(e) => setForm({ ...form, labsPerWeek: e.target.value })} /></div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.hasLab} onChange={(e) => setForm({ ...form, hasLab: e.target.checked })} />
              Has Lab
            </label>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4 mr-1" />Add Subject</Button>

        {isLoading ? <Loader2 className="animate-spin" /> : (
          <div className="border rounded-md overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Code</th><th className="p-2">Name</th><th className="p-2">Sem</th><th className="p-2">Lec/Wk</th><th className="p-2">Lab/Wk</th><th className="p-2">Has Lab</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {data.map((s: any) => (
                  <tr key={s._id} className="border-t">
                    <td className="p-2">{s.code}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-center">{s.semester}</td>
                    <td className="p-2 text-center">{s.lecturesPerWeek}</td>
                    <td className="p-2 text-center">{s.labsPerWeek}</td>
                    <td className="p-2 text-center">{s.hasLab ? "Yes" : "No"}</td>
                    <td className="p-2 text-center"><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(s._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Time Slots Tab ──
function TimeSlotsTab() {
  const { data = [], isLoading, createMut, deleteMut, importMut } = useCollection<any>("/timeslots");
  const [form, setForm] = useState({ day: "Monday", slotNumber: "", startTime: "", endTime: "" });

  const handleAdd = () => {
    if (!form.day || !form.slotNumber || !form.startTime || !form.endTime) return toast.error("All fields required");
    createMut.mutate({ day: form.day, slotNumber: Number(form.slotNumber), startTime: form.startTime, endTime: form.endTime });
    setForm({ day: "Monday", slotNumber: "", startTime: "", endTime: "" });
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Slots</CardTitle>
        <CardDescription>Define daily periods or import from CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CsvUpload onUpload={(f) => importMut.mutate(f)} loading={importMut.isPending} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <Label>Day</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><Label>Period #</Label><Input type="number" min={1} value={form.slotNumber} onChange={(e) => setForm({ ...form, slotNumber: e.target.value })} /></div>
          <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          <div><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
        </div>
        <Button onClick={handleAdd} disabled={createMut.isPending}><Plus className="h-4 w-4 mr-1" />Add Slot</Button>

        {isLoading ? <Loader2 className="animate-spin" /> : (
          <div className="border rounded-md overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Day</th><th className="p-2">Period</th><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Actions</th></tr></thead>
              <tbody>
                {data.map((t: any) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2">{t.day}</td>
                    <td className="p-2 text-center">{t.slotNumber}</td>
                    <td className="p-2 text-center">{t.startTime}</td>
                    <td className="p-2 text-center">{t.endTime}</td>
                    <td className="p-2 text-center"><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(t._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ──
export default function ImportData() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">Add or import faculty, rooms, subjects, and time slots</p>
      </div>
      <Tabs defaultValue="faculty">
        <TabsList>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="timeslots">Time Slots</TabsTrigger>
        </TabsList>
        <TabsContent value="faculty"><FacultyTab /></TabsContent>
        <TabsContent value="rooms"><RoomsTab /></TabsContent>
        <TabsContent value="subjects"><SubjectsTab /></TabsContent>
        <TabsContent value="timeslots"><TimeSlotsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
