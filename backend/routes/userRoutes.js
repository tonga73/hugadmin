import express from "express";
const router = express.Router();

import {
  register,
  autenticate,
  verify,
  forgotPassword,
  verifyToken,
  newPassword,
  profile,
} from "../controllers/userController.js";

import checkAuth from "../middleware/checkAuth.js";

// Autenticacion, registro y confirmacion de usuarios
router.post("/", register);
router.post("/login", autenticate);
router.get("/verify/:token", verify);
router.post("/forgot-password", forgotPassword);
router.route("/forgot-password/:token").get(verifyToken).post(newPassword);

router.get("/profile", checkAuth, profile);

export default router;
