import { rest } from "msw";
import { server } from "../mocks/server";
import { register, login } from "./authService";

const url = (path) => `http://localhost:4001${path}`;

test('happy register: recorta y normaliza name/email ("Ana"/"ana@mail.com") y devuelve el body del backend', async () => {
  let receivedBody;
  server.use(
    rest.post(url("/api/auth/register"), async (req, res, ctx) => {
      receivedBody = await req.json();
      return res(ctx.status(201), ctx.json({ id: "1", name: "Ana", email: "ana@mail.com" }));
    }),
  );

  const result = await register({
    name: " Ana ",
    email: "  ANA@Mail.com ",
    password: "secreto",
  });

  expect(receivedBody.name).toBe("Ana");
  expect(receivedBody.email).toBe("ana@mail.com");
  expect(result).toEqual({ id: "1", name: "Ana", email: "ana@mail.com" });
});

test("negativo: phone en blanco no viaja en el body (queda undefined)", async () => {
  let receivedBody;
  server.use(
    rest.post(url("/api/auth/register"), async (req, res, ctx) => {
      receivedBody = await req.json();
      return res(ctx.status(201), ctx.json({}));
    }),
  );

  await register({ name: "Ana", email: "ana@mail.com", password: "secreto", phone: "   " });

  expect(receivedBody.phone).toBeUndefined();
});

test("negativo: error del backend en /auth/register (422) rechaza con el objeto clasificado sin envolverlo", async () => {
  server.use(
    rest.post(url("/api/auth/register"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ errors: [{ path: "email", msg: "inválido" }] })),
    ),
  );

  await expect(
    register({ name: "Ana", email: "mal", password: "secreto" }),
  ).rejects.toMatchObject({ kind: "VALIDATION" });
});

test("happy login: 200 devuelve exactamente {token, refreshToken}, no la respuesta completa", async () => {
  server.use(
    rest.post(url("/api/auth/login"), (req, res, ctx) =>
      res(ctx.status(200), ctx.json({ token: "tok1", refreshToken: "ref1", extra: "no debería salir" })),
    ),
  );

  const result = await login({ email: "ana@mail.com", password: "secreto" });

  expect(result).toEqual({ token: "tok1", refreshToken: "ref1" });
});

test("negativo: credenciales inválidas (401) rechaza con kind UNAUTHORIZED", async () => {
  server.use(
    rest.post(url("/api/auth/login"), (req, res, ctx) =>
      res(ctx.status(401), ctx.json({ message: "Credenciales inválidas" })),
    ),
  );

  await expect(login({ email: "ana@mail.com", password: "mal" })).rejects.toMatchObject({
    kind: "UNAUTHORIZED",
  });
});
