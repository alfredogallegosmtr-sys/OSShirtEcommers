import bcrypt from "bcrypt";
import User from "../models/User.js";

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }
  res.json(user);
};

export const updateMe = async (req, res) => {
  const { name, email } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id },
    });
    if (existing) {
      return res.status(422).json({ message: "User already exist" });
    }
    updates.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  res.json(user);
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return res.status(401).json({ message: "La contraseña actual no es correcta" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Contraseña actualizada" });
};
