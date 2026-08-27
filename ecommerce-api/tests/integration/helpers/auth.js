import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../../../src/models/User.js";

// Firma un token con el mismo shape que produce auth.controller.js (signTokens):
// payload { userId, name, role } -> requireAuth lo decodifica a req.user = { id, name, role }.
export const signToken = ({ userId, name = "Test User", role = "customer" }, options = {}) =>
  jwt.sign({ userId, name, role }, process.env.JWT_SECRET, {
    expiresIn: options.expiresIn ?? "1h",
    ...options.jwtOptions,
  });

export const createUser = async ({
  name = "Test User",
  email,
  password = "Secret123!",
  role = "customer",
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    role,
  });
  return user;
};

export const createUserAndToken = async (overrides = {}) => {
  const user = await createUser(overrides);
  const token = signToken({ userId: user._id.toString(), name: user.name, role: user.role });
  return { user, token };
};
