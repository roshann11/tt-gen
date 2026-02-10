import type { Request, Response } from "express";
import Timetable from "../models/timetable.js";

export const getAll = async (_req: Request, res: Response) => {
  const data = await Timetable.find().sort({ semester: 1 });
  res.json({ success: true, data });
};

export const getBySemester = async (req: Request, res: Response) => {
  const data = await Timetable.findOne({ semester: Number(req.params.semester) });
  if (!data) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data });
};

export const remove = async (req: Request, res: Response) => {
  await Timetable.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
};


