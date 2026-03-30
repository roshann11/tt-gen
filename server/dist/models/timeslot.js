"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const timeSlotSchema = new mongoose_1.Schema({
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "10:00"
    slotNumber: { type: Number, required: true },
}, { timestamps: true });
timeSlotSchema.index({ day: 1, slotNumber: 1 }, { unique: true });
exports.default = (0, mongoose_1.model)("TimeSlot", timeSlotSchema);
