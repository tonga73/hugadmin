import mongoose from "mongoose";

const recordSchema = mongoose.Schema(
  {
    order: {
      type: String,
      trim: true,
      required: true,
    },
    cover: {
      type: String,
      trim: true,
      required: true,
    },
    archive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "Acepta cargo",
        "Acto pericial realizado",
        "Pericia realizada",
        "Sentencia o convenio de partes",
        "Honorarios regulados",
        "En tratativa de cobro",
        "Cobrado",
      ],
      default: "Acepta cargo",
    },
    location: {
      type: String,
      enum: ["San Vicente", "Oberá", "Leandro N. Alem", "25 de Mayo"],
      default: "Oberá",
    },
    priority: {
      type: String,
      enum: ["Inactivo", "Nula", "Baja", "Media", "Alta", "Urgente"],
      default: "Nula",
    },
    court: {
      type: String,
      enum: ["Civil", "Laboral", "Familia", "Universal"],
      default: "Juzgado Civil",
    },
  },
  {
    timestamps: true,
  }
);

const Record = mongoose.model("Record", recordSchema);

export default Record;
