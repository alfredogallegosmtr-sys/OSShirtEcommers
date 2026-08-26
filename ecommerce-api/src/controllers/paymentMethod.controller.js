import mongoose from "mongoose";
import PaymentMethod from "../models/PaymentMethod.js";

const unsetOtherDefaults = async (userId, exceptId) => {
  await PaymentMethod.updateMany(
    { user: userId, _id: { $ne: exceptId } },
    { isDefault: false },
  );
};

export const getPaymentMethods = async (req, res) => {
  const methods = await PaymentMethod.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(methods);
};

export const createPaymentMethod = async (req, res) => {
  const method = await PaymentMethod.create({ ...req.body, user: req.user.id });

  if (method.isDefault) {
    await unsetOtherDefaults(req.user.id, method._id);
  }

  res.status(201).json(method);
};

export const updatePaymentMethod = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Método de pago no encontrado" });
  }

  const method = await PaymentMethod.findOneAndUpdate(
    { _id: id, user: req.user.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!method) {
    return res.status(404).json({ message: "Método de pago no encontrado" });
  }

  if (method.isDefault) {
    await unsetOtherDefaults(req.user.id, method._id);
  }

  res.json(method);
};

export const deletePaymentMethod = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: "Método de pago no encontrado" });
  }

  const method = await PaymentMethod.findOneAndDelete({
    _id: id,
    user: req.user.id,
  });

  if (!method) {
    return res.status(404).json({ message: "Método de pago no encontrado" });
  }

  res.status(204).send();
};
