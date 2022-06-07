import express from "express";

import {
  getRecords,
  newRecord,
  getRecord,
  editRecord,
  removeRecord,
} from "../controllers/recordController.js";

import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.route("/").get(checkAuth, getRecords).post(checkAuth, newRecord);

router
  .route("/:id")
  .get(checkAuth, getRecord)
  .put(checkAuth, editRecord)
  .delete(checkAuth, removeRecord);

export default router;
