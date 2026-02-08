import { Schema, model } from "mongoose";

const facultySchema = new Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  subjects: [{ type: String }], // subject codes they can teach
}, { timestamps: true });

export default model("Faculty", facultySchema);
