import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Faculty
export const getFaculty = () => api.get("/faculty").then((r) => r.data);
export const createFaculty = (data: any) => api.post("/faculty", data).then((r) => r.data);
export const updateFaculty = (id: string, data: any) => api.put(`/faculty/${id}`, data).then((r) => r.data);
export const deleteFaculty = (id: string) => api.delete(`/faculty/${id}`).then((r) => r.data);

// Rooms
export const getRooms = () => api.get("/rooms").then((r) => r.data);
export const createRoom = (data: any) => api.post("/rooms", data).then((r) => r.data);
export const updateRoom = (id: string, data: any) => api.put(`/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`).then((r) => r.data);

// Subjects
export const getSubjects = () => api.get("/subjects").then((r) => r.data);
export const createSubject = (data: any) => api.post("/subjects", data).then((r) => r.data);
export const updateSubject = (id: string, data: any) => api.put(`/subjects/${id}`, data).then((r) => r.data);
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`).then((r) => r.data);

// Time Slots
export const getTimeSlots = () => api.get("/timeslots").then((r) => r.data);
export const createTimeSlot = (data: any) => api.post("/timeslots", data).then((r) => r.data);
export const updateTimeSlot = (id: string, data: any) => api.put(`/timeslots/${id}`, data).then((r) => r.data);
export const deleteTimeSlot = (id: string) => api.delete(`/timeslots/${id}`).then((r) => r.data);

// Timetable
export const generateTimetable = () => api.post("/timetable/generate").then((r) => r.data);
export const getTimetable = () => api.get("/timetable").then((r) => r.data);

export default api;
