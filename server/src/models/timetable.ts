import { Schema, model } from "mongoose";

const entrySchema = new Schema({
  day: String,
  slotNumber: Number,
  subject: String,    // subject code
  faculty: String,    // faculty shortName
  room: String,       // room/lab name
  type: { type: String, enum: ["lecture", "lab"] },
});

const timetableSchema = new Schema({
  semester: { type: Number, required: true },
  entries: [entrySchema],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default model("Timetable", timetableSchema);
