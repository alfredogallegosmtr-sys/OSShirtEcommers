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
  ip: "127.0.0.1",
  originalUrl: "/api/test",
});

describe("requireAuth", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it("[happy] Bearer válido → llama next() y puebla req.user", async () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: "u1", name: "Ana", role: "customer" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("[negativo] sin header Authorization → 401, no llama next()", async () => {
    const req = buildReq(undefined);
    const res = buildRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] prefijo mal formado (bearer minúscula) → 401, no llama next()", async () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const req = buildReq(`bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] firma inválida/corrupta → 401 'Token inválido o expirado'", async () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: "1h",
    });
    const tamperedToken = `${token}tampered`;
    const req = buildReq(`Bearer ${tamperedToken}`);
    const res = buildRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] token expirado → 401, no llama next()", async () => {
    const token = jwt.sign({ userId: "u1", name: "Ana", role: "customer" }, SECRET, {
      expiresIn: -1,
    });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("[negativo] req.user.role === 'customer' → 403, no llama next()", async () => {
    const req = { user: { id: "u1", name: "Ana", role: "customer" }, ip: "127.0.0.1", originalUrl: "/api/test" };
    const res = buildRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Requiere rol de administrador" });
    expect(next).not.toHaveBeenCalled();
  });

  it("[happy] req.user.role === 'admin' → llama next(), sin responder", async () => {
    const req = { user: { id: "u1", name: "Ana", role: "admin" }, ip: "127.0.0.1", originalUrl: "/api/test" };
    const res = buildRes();
    const next = vi.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("[negativo] req.user es undefined (requireAuth nunca corrió) → 403, no lanza", async () => {
    const req = { ip: "127.0.0.1", originalUrl: "/api/test" };
    const res = buildRes();
    const next = vi.fn();

    await expect(requireAdmin(req, res, next)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Requiere rol de administrador" });
    expect(next).not.toHaveBeenCalled();
  });
});
