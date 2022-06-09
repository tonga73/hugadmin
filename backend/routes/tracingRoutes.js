import express from "express";

import {
  addTracing,
  getTracing,
  updateTracing,
  removeTracing,
  changeStatus,
} from "../controllers/tracingController.js";

import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.post("/", addTracing);

router
  .route("/:id")
  .get(checkAuth, getTracing)
  .put(checkAuth, updateTracing)
  .delete(checkAuth, removeTracing);

router.post("/status/:id", checkAuth, changeStatus);

export default router;
