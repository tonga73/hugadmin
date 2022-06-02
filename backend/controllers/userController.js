import User from "../models/User.js";
import generateId from "../helpers/generateId.js";
import generateJWT from "../helpers/generateJWT.js";
import { registerEmail, forgotPasswordEmail } from "../helpers/email.js";

const register = async (req, res) => {
  // Evitar registros duplicados
  const { email } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    const error = new Error("Usuario ya registrado");

    return res.status(400).json({ msg: error.message });
  }

  try {
    const user = new User(req.body);
    user.token = generateId();

    await user.save();

    // Enviar el email del registrado
    // registerEmail({
    //   email: user.email,
    //   name: user.name,
    //   token: user.token,
    // });

    res.json({
      msg: "Usuario creado correctamente. Revisa tu Email para confirmar tu cuenta",
    });
  } catch (error) {
    console.log(error);
  }
};

const autenticate = async (req, res) => {
  const { email, password } = req.body;

  // Comprobar si el usuario existe
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("El Usuario no existe");
    return res.status(404).json({ msg: error.message });
  }

  // Comprobar si el usuario esta confirmado
  if (!user.verified) {
    const error = new Error("Tu Cuenta no ha sido confirmada");
    return res.status(403).json({ msg: error.message });
  }

  // Comprobar su password
  if (await user.verifyPassword(password)) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateJWT(user._id),
    });
  } else {
    const error = new Error("El Password es Incorrecto");
    return res.status(403).json({ msg: error.message });
  }
};

const verify = async (req, res) => {
  const { token } = req.params;
  const userVerify = await User.findOne({ token });
  if (!userVerify) {
    const error = new Error("Token invalido");
    return res.status(403).json({ msg: error.message });
  }

  try {
    userVerify.verified = true;
    userVerify.token = "";

    await userVerify.save();
    res.json({ msg: "Usuario Confirmado Correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("El Usuario no existe");
    return res.status(404).json({ msg: error.message });
  }

  try {
    user.token = generateId();
    await user.save();

    // Enviar el email
    forgotPasswordEmail({
      email: user.email,
      name: user.name,
      token: user.token,
    });

    res.json({ msg: "Hemos enviado un email con las instrucciones" });
  } catch (error) {}
};

const verifyToken = async (req, res) => {
  const { token } = req.params;

  const validToken = await User.findOne({ token });

  if (validToken) {
    res.json({ msg: "Token valido y el Usuario existe" });
  } else {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }
};

const newPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({ token });

  if (user) {
    user.password = password;
    user.token = "";
    try {
      await user.save();
      res.json({ msg: "Password Modificado Correctamente" });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error("Token no valido");
    return res.status(404).json({ msg: error.message });
  }
};

const profile = async (req, res) => {
  const { user } = req;

  res.json(user);
};

export {
  register,
  autenticate,
  verify,
  forgotPassword,
  verifyToken,
  newPassword,
  profile,
};
