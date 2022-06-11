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
  editUser,
  getUsers,
} from "../controllers/userController.js";

import checkAuth from "../middleware/checkAuth.js";
import checkAdmin from "../middleware/checkAdmin.js";

// Autenticacion, registro y confirmacion de usuarios
router.post("/", register);

router.post("/login", autenticate);
router.get("/verify/:token", verify);
router.post("/forgot-password", forgotPassword);
router.route("/forgot-password/:token").get(verifyToken).post(newPassword);

router.post("/:id", checkAuth, editUser);

router.get("/profile", checkAuth, profile);

// ADMIN ROUTES
router.get("/", checkAuth, getUsers);

export default router;
