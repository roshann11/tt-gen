import { Schema, model } from "mongoose";

const labSchema = new Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  equipment: [{ type: String }],
}, { timestamps: true });

export default model("Lab", labSchema);
