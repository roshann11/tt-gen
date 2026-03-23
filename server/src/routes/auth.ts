import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme_secret";

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    return res.json({ token, user: { username: user.username, role: user.role } });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/seed — create default accounts
router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const defaults = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "faculty", password: "faculty123", role: "faculty" },
      { username: "student", password: "student123", role: "student" },
    ];
    for (const u of defaults) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ username: u.username, password: hashed, role: u.role });
      }
    }
    return res.json({ message: "Default users seeded" });
  } catch (err) {
    return res.status(500).json({ message: "Seed failed" });
  }
});

export default router;
