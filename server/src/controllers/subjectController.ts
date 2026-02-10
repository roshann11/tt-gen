import type { Request, Response } from "express";
import Subject from "../models/subject.js";
import { parseCSV } from "../utils/csvParser.js";

export const getAll = async (_req: Request, res: Response) => {
  const data = await Subject.find();
  res.json({ success: true, data });
};

export const create = async (req: Request, res: Response) => {
  const doc = await Subject.create(req.body);
  res.status(201).json({ success: true, data: doc });
};

export const update = async (req: Request, res: Response) => {
  const doc = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: doc });
};

export const remove = async (req: Request, res: Response) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
};

export const importCSV = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const rows = await parseCSV<any>(req.file.path);
  const docs = await Subject.insertMany(rows);
  res.status(201).json({ success: true, data: docs, count: docs.length });
};
