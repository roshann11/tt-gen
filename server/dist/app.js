"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const faculty_1 = __importDefault(require("./routes/faculty"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const labs_1 = __importDefault(require("./routes/labs"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const timeSlots_1 = __importDefault(require("./routes/timeSlots"));
const timetable_1 = __importDefault(require("./routes/timetable"));
const errorHandler_1 = require("./middleware/errorHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
//connectDB();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.get("/", (_req, res) => res.json({ message: "API is running" }));
app.use("/api/faculty", faculty_1.default);
app.use("/api/rooms", rooms_1.default);
app.use("/api/labs", labs_1.default);
app.use("/api/subjects", subjects_1.default);
app.use("/api/timeslots", timeSlots_1.default);
app.use("/api/timetable", timetable_1.default);
app.use(errorHandler_1.errorHandler);
mongoose_1.default
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/timetable-generator")
    .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
    .catch((err) => console.error("❌ MongoDB connection error:", err));
exports.default = app;
