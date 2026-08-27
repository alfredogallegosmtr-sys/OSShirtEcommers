import { rest } from "msw";
import { server } from "../mocks/server";
import { getMe, updateMe, changePassword } from "./userService";

const url = (path) => `http://localhost:4001/api${path}`;

test("happy: getMe devuelve el usuario; updateMe devuelve el usuario actualizado", async () => {
  const user = { _id: "u1", name: "Ana", email: "ana@mail.com" };
  const updatedUser = { ...user, name: "Ana Actualizada" };
  server.use(
    rest.get(url("/users/me"), (req, res, ctx) => res(ctx.status(200), ctx.json(user))),
    rest.put(url("/users/me"), (req, res, ctx) => res(ctx.status(200), ctx.json(updatedUser))),
  );

  await expect(getMe()).resolves.toEqual(user);
  await expect(updateMe({ name: "Ana Actualizada" })).resolves.toEqual(updatedUser);
});

test("happy: changePassword envía currentPassword y newPassword a /users/me/password", async () => {
  let body;
  server.use(
    rest.put(url("/users/me/password"), async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(200), ctx.json({ message: "ok" }));
    }),
  );

  await changePassword({ currentPassword: "vieja", newPassword: "nueva123" });

  expect(body).toEqual({ currentPassword: "vieja", newPassword: "nueva123" });
});

test('negativo: email en uso - PUT /api/users/me 422 {message:"User already exist"} rechaza con el objeto clasificado y el mensaje accesible en err.original.response.data.message', async () => {
  server.use(
    rest.put(url("/users/me"), (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ message: "User already exist" })),
    ),
  );

  const err = await updateMe({ email: "en-uso@mail.com" }).catch((e) => e);

  expect(err.kind).toBe("VALIDATION");
  expect(err.original.response.data.message).toBe("User already exist");
});

test("negativo: contraseña actual incorrecta - PUT /api/users/me/password 401 rechaza con kind UNAUTHORIZED y err.original.response.status === 401", async () => {
  server.use(
    rest.put(url("/users/me/password"), (req, res, ctx) =>
      res(ctx.status(401), ctx.json({ message: "contraseña incorrecta" })),
    ),
  );

  const err = await changePassword({ currentPassword: "mal", newPassword: "nueva123" }).catch(
    (e) => e,
  );

  expect(err.kind).toBe("UNAUTHORIZED");
  expect(err.original.response.status).toBe(401);
});
