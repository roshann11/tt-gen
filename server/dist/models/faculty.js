"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const facultySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    shortName: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    subjects: [{ type: String }], // subject codes they can teach
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Faculty", facultySchema);
