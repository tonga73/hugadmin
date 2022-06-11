import User from "../models/User.js";

const checkAdmin = async (req, res, next) => {
  let user;

  if (user.role !== "admin") {
    const error = new Error("Ingreso no autorizado.");
    return res.status(401).json({ msg: error.message });
  }

  next();
};

export default checkAdmin;
