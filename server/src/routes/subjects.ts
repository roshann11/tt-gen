import { Router } from "express";
import * as ctrl from "../controllers/subjectController";
import { upload } from "../middleware/upload";

const router = Router();
router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.post("/import", upload.single("file"), ctrl.importCSV);

export default router;
