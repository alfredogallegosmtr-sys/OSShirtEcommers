import { describe, it, expect, vi, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, requireAdmin } from "../../../src/middlewares/auth.middleware.js";

const SECRET = "test-jwt-secret";

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const buildReq = (authorizationHeader) => ({
  headers: authorizationHeader !== undefined ? { authorization: authorizationHeader } : {},
});

describe("requireAuth", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it("[happy] Bearer válido → llama next() y puebla req.user", () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: "u1", name: "Ana", role: "customer" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("[negativo] sin header Authorization → 401, no llama next()", () => {
    const req = buildReq(undefined);
    const res = buildRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] prefijo mal formado (bearer minúscula) → 401, no llama next()", () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const req = buildReq(`bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] firma inválida/corrupta → 401 'Token inválido o expirado'", () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const tamperedToken = `${token}tampered`;
    const req = buildReq(`Bearer ${tamperedToken}`);
    const res = buildRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] token expirado → 401, no llama next()", () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: -1,
    });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("[negativo] req.user.role === 'customer' → 403, no llama next()", () => {
    const req = { user: { id: "u1", name: "Ana", role: "customer" } };
    const res = buildRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Requiere rol de administrador" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[happy] req.user.role === 'admin' → llama next(), sin responder", () => {
    const req = { user: { id: "u1", name: "Ana", role: "admin" } };
    const res = buildRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("[negativo] req.user es undefined (requireAuth nunca corrió) → 403, no lanza", () => {
    const req = {};
    const res = buildRes();
    const next = vi.fn();

    expect(() => requireAdmin(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Requiere rol de administrador" });
    expect(next).not.toHaveBeenCalled();
  });
});
