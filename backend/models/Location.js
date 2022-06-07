import mongoose from "mongoose";

const locationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
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

const Location = mongoose.model("Location", locationSchema);

export default Location;
