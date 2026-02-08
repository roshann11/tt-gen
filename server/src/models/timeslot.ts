import { Schema, model } from "mongoose";

const timeSlotSchema = new Schema({
  day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  slotNumber: { type: Number, required: true },
}, { timestamps: true });

timeSlotSchema.index({ day: 1, slotNumber: 1 }, { unique: true });
export default model("TimeSlot", timeSlotSchema);
