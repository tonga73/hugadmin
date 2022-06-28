import express from "express";
import dotenv from "dotenv";

import cors from "cors";

import conectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import tracingRoutes from "./routes/tracingRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

const app = express();
app.use(express.json());

dotenv.config();

conectDB();

// Configurar CORS con WHITELIST
const whitelist = [
  "http://localhost:3000",
  "http://localhost",
  "http://reactapp:3000",
  "http://reactapp",
  "http://143.110.237.52.188",
  "http://143.110.237.52.188:80",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log(origin);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Error de CORS"));
    }
  },
};

app.use(cors(corsOptions));

// CORS BYPASS
// app.use(cors());

// Routing
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/tracings", tracingRoutes);
app.use("/api/locations", locationRoutes);

const hostname = "127.0.0.1";
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://expressapp:${PORT}/`);
});
