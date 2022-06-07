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
    priority: {
      type: String,
      enum: ["Inactivo", "Nula", "Baja", "Media", "Alta", "Urgente"],
      default: "Nula",
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Record = mongoose.model("Record", recordSchema);

export default Record;
