import { Schema, model } from "mongoose";

const roomSchema = new Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ["lecture", "lab"], default: "lecture" },
}, { timestamps: true });

export default model("Room", roomSchema);
