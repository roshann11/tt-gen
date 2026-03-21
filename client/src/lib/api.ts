import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const loginUser = (username: string, password: string) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);

export const seedUsers = () => api.post("/auth/seed").then((r) => r.data);

// ── Faculty ──
export const getFaculties = () => api.get("/faculty").then((r) => r.data);
export const createFaculty = (data: any) => api.post("/faculty", data).then((r) => r.data);
export const updateFaculty = (id: string, data: any) => api.put(`/faculty/${id}`, data).then((r) => r.data);
export const deleteFaculty = (id: string) => api.delete(`/faculty/${id}`).then((r) => r.data);
export const importFaculty = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/faculty/import", fd).then((r) => r.data);
};

// ── Rooms ──
export const getRooms = () => api.get("/rooms").then((r) => r.data);
export const createRoom = (data: any) => api.post("/rooms", data).then((r) => r.data);
export const updateRoom = (id: string, data: any) => api.put(`/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`).then((r) => r.data);
export const importRooms = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/rooms/import", fd).then((r) => r.data);
};

// ── Subjects ──
export const getSubjects = () => api.get("/subjects").then((r) => r.data);
export const createSubject = (data: any) => api.post("/subjects", data).then((r) => r.data);
export const updateSubject = (id: string, data: any) => api.put(`/subjects/${id}`, data).then((r) => r.data);
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`).then((r) => r.data);
export const importSubjects = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/subjects/import", fd).then((r) => r.data);
};

// ── Time Slots ──
export const getTimeSlots = () => api.get("/timeslots").then((r) => r.data);
export const createTimeSlot = (data: any) => api.post("/timeslots", data).then((r) => r.data);
export const updateTimeSlot = (id: string, data: any) => api.put(`/timeslots/${id}`, data).then((r) => r.data);
export const deleteTimeSlot = (id: string) => api.delete(`/timeslots/${id}`).then((r) => r.data);
export const importTimeSlots = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/timeslots/import", fd).then((r) => r.data);
};

// ── Timetable ──
export const generateTimetable = () => api.post("/timetable/generate").then((r) => r.data);
export const getTimetable = () => api.get("/timetable").then((r) => r.data);

export default api;
