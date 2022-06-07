import Location from "../models/Location.js";
import Record from "../models/Record.js";

const newLocation = async (req, res) => {
  const location = new Location(req.body);

  try {
    const storedLocation = await location.save();
    res.json(storedLocation);
  } catch (error) {
    console.log(error);
  }
};

const getLocation = async (req, res) => {
  const { id } = req.params;

  const location = await Location.findById(id);

  if (!location) {
    const error = new Error("Ubicación no encontrada.");
    return res.status(404).json({ msg: error.message });
  }

  const records = await Record.find().where("location").equals(location._id);

  console.log({ location, records });
  console.log(location);
};

export { newLocation, getLocation };
