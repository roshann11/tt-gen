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
exports.importCSV = exports.remove = exports.update = exports.create = exports.getAll = void 0;
const room_1 = __importDefault(require("../models/room"));
const csvParser_1 = require("../utils/csvParser");
const getAll = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield room_1.default.find();
    res.json({ success: true, data });
});
exports.getAll = getAll;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield room_1.default.create(req.body);
    res.status(201).json({ success: true, data: doc });
});
exports.create = create;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield room_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc)
        return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield room_1.default.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
});
exports.remove = remove;
const importCSV = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file)
        return res.status(400).json({ success: false, message: "No file uploaded" });
    const rows = yield (0, csvParser_1.parseCSV)(req.file.path);
    const docs = yield room_1.default.insertMany(rows);
    res.status(201).json({ success: true, data: docs, count: docs.length });
});
exports.importCSV = importCSV;
