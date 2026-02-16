import { Router } from "express";
import * as ctrl from "../controllers/timetableController";

const router = Router();
router.get("/", ctrl.getAll);
router.post("/generate", ctrl.generate);
router.get("/:semester", ctrl.getBySemester);
router.delete("/:id", ctrl.remove);


export default router;
