"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.remove = exports.getBySemester = exports.getAll = void 0;
const timetable_1 = __importDefault(require("../models/timetable"));
const scheduler_1 = require("../services/scheduler");
const getAll = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield timetable_1.default.find().sort({ semester: 1 });
    res.json({ success: true, data });
});
exports.getAll = getAll;
const getBySemester = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield timetable_1.default.findOne({ semester: Number(req.params.semester) });
    if (!data)
        return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
});
exports.getBySemester = getBySemester;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield timetable_1.default.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
});
exports.remove = remove;
const generate = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timetables = yield (0, scheduler_1.generateTimetable)();
        res.json({
            success: true,
            message: `Generated timetables for ${timetables.length} semesters`,
            data: timetables,
        });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});
exports.generate = generate;
