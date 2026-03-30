"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const roomSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    type: { type: String, enum: ["lecture", "lab"], default: "lecture" },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Room", roomSchema);
