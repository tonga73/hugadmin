import mongoose from "mongoose";

const tracingSchema = mongoose.Schema(
  {
    comment: {
      type: String,
      trim: true,
      required: true,
    },
    observations: {
      type: String,
      trim: true,
      default: "",
    },
    archive: {
      type: Boolean,
      default: false,
    },
    important: {
      type: Boolean,
      default: false,
    },
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
    },
  },
  {
    timestamps: true,
  }
);

const Tracing = mongoose.model("Tracing", tracingSchema);

export default Tracing;
