import { rest } from "msw";
import { server } from "../mocks/server";
import apiClient from "./apiClient";

const url = (path) => `http://localhost:4001/api${path}`;

afterEach(() => {
  localStorage.removeItem("authToken");
});

test("happy: con authToken en localStorage, la request sale con Authorization: Bearer <token>", async () => {
  let receivedAuth;
  server.use(
    rest.get(url("/whoami"), (req, res, ctx) => {
      receivedAuth = req.headers.get("authorization");
      return res(ctx.status(200), ctx.json({ ok: true }));
    }),
  );
  localStorage.setItem("authToken", "my-token");

  await apiClient.get("/whoami");

  expect(receivedAuth).toBe("Bearer my-token");
});

test("negativo: sin authToken, la request sale sin header Authorization", async () => {
  let receivedAuth;
  server.use(
    rest.get(url("/whoami"), (req, res, ctx) => {
      receivedAuth = req.headers.get("authorization");
      return res(ctx.status(200), ctx.json({ ok: true }));
    }),
  );

  await apiClient.get("/whoami");

  expect(receivedAuth).toBeNull();
});

test("negativo: classifyError 404 -> kind NOT_FOUND", async () => {
  server.use(
    rest.get(url("/missing"), (req, res, ctx) => res(ctx.status(404), ctx.json({ message: "not found" }))),
  );

  await expect(apiClient.get("/missing")).rejects.toMatchObject({
    kind: "NOT_FOUND",
    status: 404,
  });
});

test("negativo: classifyError 401 -> kind UNAUTHORIZED", async () => {
  server.use(
    rest.get(url("/secret"), (req, res, ctx) => res(ctx.status(401), ctx.json({ message: "no auth" }))),
  );

  await expect(apiClient.get("/secret")).rejects.toMatchObject({
    kind: "UNAUTHORIZED",
    status: 401,
  });
});

test("negativo: classifyError 403 -> kind FORBIDDEN", async () => {
  server.use(
    rest.get(url("/admin-only"), (req, res, ctx) => res(ctx.status(403), ctx.json({ message: "forbidden" }))),
  );

  await expect(apiClient.get("/admin-only")).rejects.toMatchObject({
    kind: "FORBIDDEN",
    status: 403,
  });
});

test('negativo: classifyError 422 con {errors:[...]} -> kind VALIDATION con fields', async () => {
  const errors = [{ path: "email", msg: "Email inválido" }];
  server.use(
    rest.post(url("/things"), (req, res, ctx) => res(ctx.status(422), ctx.json({ errors }))),
  );

  await expect(apiClient.post("/things", {})).rejects.toMatchObject({
    kind: "VALIDATION",
    status: 422,
    fields: errors,
  });
});

test("negativo: classifyError 422 sin errors -> kind VALIDATION con fields undefined", async () => {
  server.use(
    rest.post(url("/things"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ message: "User already exist" })),
    ),
  );

  const err = await apiClient.post("/things", {}).catch((e) => e);

  expect(err.kind).toBe("VALIDATION");
  expect(err.fields).toBeUndefined();
});

test("negativo: classifyError otro 4xx (400) -> kind CLIENT_ERROR", async () => {
  server.use(
    rest.get(url("/bad-request"), (req, res, ctx) => res(ctx.status(400), ctx.json({ message: "bad" }))),
  );

  await expect(apiClient.get("/bad-request")).rejects.toMatchObject({
    kind: "CLIENT_ERROR",
    status: 400,
  });
});

test("negativo: classifyError 500 -> kind SERVER_ERROR", async () => {
  server.use(
    rest.get(url("/boom"), (req, res, ctx) => res(ctx.status(500), ctx.json({ message: "boom" }))),
  );

  await expect(apiClient.get("/boom")).rejects.toMatchObject({
    kind: "SERVER_ERROR",
    status: 500,
  });
});

test("negativo: sin respuesta (error de red) -> kind NETWORK", async () => {
  server.use(rest.get(url("/unreachable"), (req, res) => res.networkError("Failed to connect")));

  await expect(apiClient.get("/unreachable")).rejects.toMatchObject({
    kind: "NETWORK",
  });
});

// NOTA (no automatizado): el caso "timeout" del plan de pruebas
// (handler que excede los 10000ms de axios -> kind: "TIMEOUT") no se pudo
// automatizar con MSW v1: `@mswjs/interceptors` (XMLHttpRequestOverride)
// únicamente reenvía `xhr.timeout` a la petición real de red cuando la
// request NO es interceptada (passthrough); para una respuesta mockeada por
// un handler (como exige "nunca mockear axios/fetch a mano") nunca se agenda
// un timer propio, así que `ontimeout` jamás se dispara sin importar cuánto
// tarde `ctx.delay(...)`. Verificado leyendo
// node_modules/@mswjs/interceptors/lib/interceptors/XMLHttpRequest/XMLHttpRequestOverride.js
// (la asignación `originalRequest.timeout = this.timeout` vive solo en la
// rama de passthrough). El resto de `classifyError` (404/401/403/422/400/500/
// NETWORK) sí queda cubierto arriba.
