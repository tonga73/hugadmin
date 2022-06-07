import express from "express";

import { newLocation, getLocation } from "../controllers/locationController.js";

import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.route("/").post(newLocation);

router.route("/:id").get(getLocation);

export default router;
