import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const list = (url: string) =>
  api.get(url).then((r) => (Array.isArray(r.data) ? r.data : r.data.data || []));

// Auth
export const loginUser = (username: string, password: string) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);
export const seedUsers = () => api.post("/auth/seed").then((r) => r.data);

// Faculty
export const getFaculty = () => list("/faculty");
export const createFaculty = (data: any) => api.post("/faculty", data).then((r) => r.data);
export const updateFaculty = (id: string, data: any) => api.put(`/faculty/${id}`, data).then((r) => r.data);
export const deleteFaculty = (id: string) => api.delete(`/faculty/${id}`).then((r) => r.data);

// Subjects
export const getSubjects = () => list("/subjects");
export const createSubject = (data: any) => api.post("/subjects", data).then((r) => r.data);
export const updateSubject = (id: string, data: any) => api.put(`/subjects/${id}`, data).then((r) => r.data);
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`).then((r) => r.data);

// Rooms
export const getRooms = () => list("/rooms");
export const createRoom = (data: any) => api.post("/rooms", data).then((r) => r.data);
export const updateRoom = (id: string, data: any) => api.put(`/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`).then((r) => r.data);

// Time Slots
export const getTimeSlots = () => list("/timeslots");
export const createTimeSlot = (data: any) => api.post("/timeslots", data).then((r) => r.data);
export const updateTimeSlot = (id: string, data: any) => api.put(`/timeslots/${id}`, data).then((r) => r.data);
export const deleteTimeSlot = (id: string) => api.delete(`/timeslots/${id}`).then((r) => r.data);

// Timetable
export const generateTimetable = () => api.post("/timetable/generate").then((r) => r.data);
export const getTimetable = () => api.get("/timetable").then((r) => r.data);

export default api;
