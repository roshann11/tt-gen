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
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "changeme_secret";
// POST /api/auth/login
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password required" });
        }
        const user = yield User_1.default.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const match = yield bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
        return res.json({ token, user: { username: user.username, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
}));
// POST /api/auth/seed — create default accounts
router.post("/seed", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const defaults = [
            { username: "admin", password: "admin123", role: "admin" },
            { username: "faculty", password: "faculty123", role: "faculty" },
            { username: "student", password: "student123", role: "student" },
        ];
        for (const u of defaults) {
            const exists = yield User_1.default.findOne({ username: u.username });
            if (!exists) {
                const hashed = yield bcryptjs_1.default.hash(u.password, 10);
                yield User_1.default.create({ username: u.username, password: hashed, role: u.role });
            }
        }
        return res.json({ message: "Default users seeded" });
    }
    catch (err) {
        return res.status(500).json({ message: "Seed failed" });
    }
}));
exports.default = router;
