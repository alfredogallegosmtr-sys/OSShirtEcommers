import jwt from "jsonwebtoken";
import { logSecurityEvent } from "../utils/securityLog.js";

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    await logSecurityEvent("auth_missing_token", { ip: req.ip, path: req.originalUrl });
    return res.status(401).json({ message: "No autorizado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, name: payload.name, role: payload.role };
    next();
  } catch (_error) {
    await logSecurityEvent("auth_invalid_token", { ip: req.ip, path: req.originalUrl });
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Debe montarse siempre después de requireAuth: depende de req.user.
export const requireAdmin = async (req, res, next) => {
  if (req.user?.role !== "admin") {
    await logSecurityEvent("authorization_denied", {
      ip: req.ip,
      path: req.originalUrl,
      userId: req.user?.id,
      role: req.user?.role,
    });
    return res.status(403).json({ message: "Requiere rol de administrador" });
  }
  next();
};
