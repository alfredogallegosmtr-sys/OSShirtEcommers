import mongoose from "mongoose";
import Address from "../models/Address.js";

const unsetOtherDefaults = async (userId, exceptId) => {
  await Address.updateMany(
    { user: userId, _id: { $ne: exceptId } },
    { isDefault: false },
  );
};

export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(addresses);
};

export const createAddress = async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user.id });

  if (address.isDefault) {
    await unsetOtherDefaults(req.user.id, address._id);
  }

  res.status(201).json(address);
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  const address = await Address.findOneAndUpdate(
    { _id: id, user: req.user.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!address) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  if (address.isDefault) {
    await unsetOtherDefaults(req.user.id, address._id);
  }

  res.json(address);
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  const address = await Address.findOneAndDelete({
    _id: id,
    user: req.user.id,
  });

  if (!address) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  res.status(204).send();
};
