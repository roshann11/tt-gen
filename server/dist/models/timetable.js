"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const entrySchema = new mongoose_1.Schema({
    day: String,
    slotNumber: Number,
    subject: String, // subject code
    faculty: String, // faculty shortName
    room: String, // room/lab name
    type: { type: String, enum: ["lecture", "lab"] },
});
const timetableSchema = new mongoose_1.Schema({
    semester: { type: Number, required: true },
    entries: [entrySchema],
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Timetable", timetableSchema);
