import nodemailer from "nodemailer";

export const registerEmail = async (payload) => {
  const { email, name, token } = payload;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Informacion email

  const info = await transport.sendMail({
    from: '"UpTask - Administrador de Proyectos" <cuentas@uptask.com>',
    to: email,
    subject: "UpTask - Confirma tu cuenta",
    text: "Confirma tu cuenta en UpTask",
    html: `<p>Hola: ${name}. Confirma tu cuenta en UpTask</p>
        <p>Tu cuenta ya esta casi lista, solo debes confirmarla en el siguiente enlace.</p>

        <a href="${process.env.FRONTEND_URL}/verify/${token}">Comprobar cuenta</a>

        <p>Si tu no solicitaste este email, puedes ignorar el mensaje</p>`,
  });
};

export const forgotPasswordEmail = async (payload) => {
  const { email, name, token } = payload;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Informacion email

  const info = await transport.sendMail({
    from: '"UpTask - Administrador de Proyectos" <cuentas@uptask.com>',
    to: email,
    subject: "UpTask - Reestablece tu password",
    text: "Reestablece tu password",
    html: `<p>Hola: ${name}. has solicitado reestablecer tu password.</p>
        <p>Sigue el siguiente enlace para generar un nuevo password:</p>

        <a href="${process.env.FRONTEND_URL}/forgot-password/${token}">Reestablecer Password</a>

        <p>Si tu no creaste esta cuenta, puedes ignorar el mensaje</p>`,
  });
};
