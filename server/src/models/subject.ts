import { Schema, model } from "mongoose";

const subjectSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  lecturesPerWeek: { type: Number, default: 3 },
  labsPerWeek: { type: Number, default: 1 },
  hasLab: { type: Boolean, default: true },
}, { timestamps: true });

export default model("Subject", subjectSchema);
