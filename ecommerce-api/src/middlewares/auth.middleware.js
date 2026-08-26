import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, name: payload.name, role: payload.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
