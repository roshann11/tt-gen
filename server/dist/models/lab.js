"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const labSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    equipment: [{ type: String }],
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Lab", labSchema);
