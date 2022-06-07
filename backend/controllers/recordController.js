import Record from "../models/Record.js";
import Tracing from "../models/Tracing.js";

const getRecords = async (req, res) => {
  const records = await Record.find().where("author").equals(req.user);

  res.json(records);
};

const newRecord = async (req, res) => {
  const record = new Record(req.body);

  record.author = req.user._id;

  try {
    const storedRecord = await record.save();
    res.json(storedRecord);
  } catch (error) {
    console.log(error);
  }
};

const getRecord = async (req, res) => {
  const { id } = req.params;

  const record = await Record.findById(id);

  if (!record) {
    const error = new Error("No encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  // Obtener los Seguimientos del Expediente
  const tracings = await Tracing.find().where("record").equals(record._id);

  res.json({ record, tracings });
};

const editRecord = async (req, res) => {
  const { id } = req.params;

  const record = await Record.findById(id);

  if (!record) {
    const error = new Error("No encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  record.order = req.body.order || record.order;
  record.cover = req.body.cover || record.cover;
  record.archive = req.body.archive || record.archive;
  record.status = req.body.status || record.status;
  record.location = req.body.location || record.location;
  record.priority = req.body.priority || record.priority;

  try {
    const storedRecord = await record.save();

    res.json(storedRecord);
  } catch (error) {
    console.log(error);
  }
};

const removeRecord = async (req, res) => {
  const { id } = req.params;

  const record = await Record.findById(id);

  if (!record) {
    const error = new Error("No encontrado.");
    return res.status(404).json({ msg: error.message });
  }

  try {
    await record.deleteOne();
    res.json({ msg: "Expediente eliminado." });
  } catch (error) {
    console.log(error);
  }
};

export { getRecords, newRecord, getRecord, editRecord, removeRecord };
