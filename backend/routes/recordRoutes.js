import express from "express";

import {
  getRecords,
  newRecord,
  getRecord,
  editRecord,
  removeRecord,
} from "../controllers/recordController.js";

const router = express.Router();

router.route("/").get(getRecords).post(newRecord);

router.route("/:id").get(getRecord).put(editRecord).delete(removeRecord);

export default router;
