import mongoose from "mongoose";

const recordSchema = mongoose.Schema(
  {
    order: {
      type: String,
      trim: true,
      required: true,
      unique: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    priority: {
      type: String,
      enum: ["Inactivo", "Nula", "Baja", "Media", "Alta", "Urgente"],
      default: "Nula",
    },
  },
  {
    timestamps: true,
  }
);

const Record = mongoose.model("Record", recordSchema);

export default Record;
