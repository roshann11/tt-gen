import { Router } from "express";
import * as ctrl from "../controllers/timetableController.js";

const router = Router();
router.get("/", ctrl.getAll);
router.get("/:semester", ctrl.getBySemester);
router.delete("/:id", ctrl.remove);

export default router;
