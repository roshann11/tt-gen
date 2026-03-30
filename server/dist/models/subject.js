"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const subjectSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    lecturesPerWeek: { type: Number, default: 3 },
    labsPerWeek: { type: Number, default: 1 },
    hasLab: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Subject", subjectSchema);
