import express from "express";

import {
  getLocations,
  newLocation,
  getLocation,
} from "../controllers/locationController.js";

import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.route("/").get(checkAuth, getLocations).post(checkAuth, newLocation);

router.route("/:id").get(checkAuth, getLocation);

export default router;
