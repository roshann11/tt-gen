import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import facultyRoutes from "./routes/faculty";
import roomRoutes from "./routes/rooms";
import labRoutes from "./routes/labs";
import subjectRoutes from "./routes/subjects";
import timeSlotRoutes from "./routes/timeSlots";
import timetableRoutes from "./routes/timetable";
import { errorHandler } from "./middleware/errorHandler";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";

dotenv.config();
//connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/", (_req, res) => res.json({ message: "API is running" }));
app.use("/api/faculty", facultyRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/timetable", timetableRoutes);
app.use(errorHandler);



mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/timetable-generator")
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

export default app;

