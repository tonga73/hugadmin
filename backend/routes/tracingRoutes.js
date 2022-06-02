import express from "express";

import {
  addTracing,
  getTracing,
  updateTracing,
  removeTracing,
  changeStatus,
} from "../controllers/tracingController.js";

const router = express.Router();

router.post("/", addTracing);

router.route("/:id").get(getTracing).put(updateTracing).delete(removeTracing);

router.post("/status/:id", changeStatus);

export default router;
