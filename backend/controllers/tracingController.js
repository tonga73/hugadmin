import Record from "../models/Record.js";
import Tracing from "../models/Tracing.js";

const addTracing = async (req, res) => {
  const { record } = req.body;

  const recordExists = await Record.findById(record);

  if (!recordExists) {
    const error = new Error("El expediente no existe");
    return res.status(404).json({ msg: error.message });
  }

  try {
    const storedTracing = await Tracing.create(req.body);
    res.json(storedTracing);
  } catch (error) {
    console.log(error);
  }
};

const getTracing = async (req, res) => {
  const { id } = req.params;

  const tracing = await Tracing.findById(id).populate("record");

  if (!tracing) {
    const error = new Error("Seguimiento no encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  res.json(tracing);
};

const updateTracing = async (req, res) => {
  const { id } = req.params;

  const tracing = await Tracing.findById(id).populate("record");

  if (!tracing) {
    const error = new Error("Seguimiento no encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  tracing.comment = req.body.comment || tracing.comment;
  tracing.observations = req.body.observations || tracing.observations;
  tracing.archive = req.body.archive || tracing.archive;

  try {
    const storedTracing = await tracing.save();
    res.json(storedTracing);
  } catch (error) {
    console.log(error);
  }
};

const removeTracing = async (req, res) => {
  const { id } = req.params;

  const tracing = await Tracing.findById(id).populate("record");

  if (!tracing) {
    const error = new Error("Seguimiento no encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  try {
    await tracing.deleteOne();
    res.json({ msg: "Seguimiento eliminado" });
  } catch (error) {
    console.log(error);
  }
};

const changeStatus = async (req, res) => {};

export { addTracing, getTracing, updateTracing, removeTracing, changeStatus };
