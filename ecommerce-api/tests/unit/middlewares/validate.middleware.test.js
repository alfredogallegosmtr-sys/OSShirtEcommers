import { describe, it, expect, vi } from "vitest";
import { body } from "express-validator";
import validate from "../../../src/middlewares/validation.js";

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("validate", () => {
  it("[happy] sin errores tras correr un validador que pasa → llama next(), no responde", async () => {
    const req = { body: { name: "Camiseta" } };
    await body("name").notEmpty().run(req);
    const res = buildRes();
    const next = vi.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("[negativo] con un error de validador → 422 {errors:[...]}, no llama next()", async () => {
    const req = { body: { name: "" } };
    await body("name").notEmpty().withMessage("El nombre es requerido").run(req);
    const res = buildRes();
    const next = vi.fn();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: "name", msg: "El nombre es requerido" }),
      ]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("[negativo] múltiples validadores fallando acumulan todos los errores en el array", async () => {
    const req = { body: {} };
    await body("name").notEmpty().withMessage("nombre requerido").run(req);
    await body("price").isFloat({ min: 0 }).withMessage("precio inválido").run(req);
    const res = buildRes();
    const next = vi.fn();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    const [[{ errors }]] = [res.json.mock.calls[0]];
    expect(errors).toHaveLength(2);
    expect(next).not.toHaveBeenCalled();
  });

  it("[caso límite] sin ningún validador corrido sobre req → se trata como válido, llama next()", () => {
    const req = { body: { anything: "sin validar" } };
    const res = buildRes();
    const next = vi.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("[negativo] forma exacta de la respuesta: solo la clave 'errors', sin 'message'", async () => {
    const req = { body: { name: "" } };
    await body("name").notEmpty().run(req);
    const res = buildRes();
    const next = vi.fn();

    validate(req, res, next);

    const [responseBody] = res.json.mock.calls[0];
    expect(Object.keys(responseBody)).toEqual(["errors"]);
  });
});
