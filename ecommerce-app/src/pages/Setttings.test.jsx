import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { server } from "../mocks/server";
import Settings from "./Setttings";

function mockGetMe(user = { name: "Ana", email: "ana@mail.com" }) {
  server.use(
    rest.get("http://localhost:4001/api/users/me", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(user)),
    ),
  );
}

test('happy perfil: GET /api/users/me precarga Nombre/Email, guardar -> PUT 200 -> "Perfil actualizado correctamente."', async () => {
  mockGetMe();
  let receivedBody;
  server.use(
    rest.put("http://localhost:4001/api/users/me", async (req, res, ctx) => {
      receivedBody = await req.json();
      return res(ctx.status(200), ctx.json({ name: "Ana", email: "ana@mail.com" }));
    }),
  );

  render(<Settings />);

  expect(await screen.findByLabelText("Nombre")).toHaveValue("Ana");
  expect(screen.getByLabelText("Email")).toHaveValue("ana@mail.com");

  await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(await screen.findByText("Perfil actualizado correctamente.")).toBeInTheDocument();
  expect(receivedBody).toEqual({ name: "Ana", email: "ana@mail.com" });
});

test('negativo: email en uso -> PUT 422 {message:"User already exist"} -> "Ese email ya está en uso por otra cuenta."', async () => {
  mockGetMe();
  server.use(
    rest.put("http://localhost:4001/api/users/me", (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ message: "User already exist" })),
    ),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(
    await screen.findByText("Ese email ya está en uso por otra cuenta."),
  ).toBeInTheDocument();
});

test('negativo: otro fallo al guardar perfil -> PUT 500 -> "No se pudo actualizar tu perfil."', async () => {
  mockGetMe();
  server.use(
    rest.put("http://localhost:4001/api/users/me", (req, res, ctx) => res(ctx.status(500))),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(await screen.findByText("No se pudo actualizar tu perfil.")).toBeInTheDocument();
});

test('happy contraseña: current+new+confirm iguales -> PUT /api/users/me/password 200 -> mensaje de éxito y campos vacíos', async () => {
  mockGetMe();
  let receivedBody;
  server.use(
    rest.put("http://localhost:4001/api/users/me/password", async (req, res, ctx) => {
      receivedBody = await req.json();
      return res(ctx.status(200), ctx.json({}));
    }),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.type(screen.getByLabelText("Contraseña actual"), "actual123");
  await userEvent.type(screen.getByLabelText("Nueva contraseña"), "nueva123");
  await userEvent.type(screen.getByLabelText("Confirmar nueva contraseña"), "nueva123");
  await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

  expect(
    await screen.findByText("Contraseña actualizada correctamente."),
  ).toBeInTheDocument();
  expect(receivedBody).toEqual({ currentPassword: "actual123", newPassword: "nueva123" });
  expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
  expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("");
  expect(screen.getByLabelText("Confirmar nueva contraseña")).toHaveValue("");
});

test('negativo: confirmación distinta -> "Las contraseñas nuevas no coinciden." y no se emite la petición', async () => {
  mockGetMe();
  let calls = 0;
  server.use(
    rest.put("http://localhost:4001/api/users/me/password", (req, res, ctx) => {
      calls += 1;
      return res(ctx.status(200), ctx.json({}));
    }),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.type(screen.getByLabelText("Contraseña actual"), "actual123");
  await userEvent.type(screen.getByLabelText("Nueva contraseña"), "nueva123");
  await userEvent.type(screen.getByLabelText("Confirmar nueva contraseña"), "otra456");
  await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

  expect(
    await screen.findByText("Las contraseñas nuevas no coinciden."),
  ).toBeInTheDocument();
  expect(calls).toBe(0);
});

test('negativo: contraseña actual incorrecta -> PUT .../password 401 -> "La contraseña actual no es correcta."', async () => {
  mockGetMe();
  server.use(
    rest.put("http://localhost:4001/api/users/me/password", (req, res, ctx) => res(ctx.status(401))),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.type(screen.getByLabelText("Contraseña actual"), "mala");
  await userEvent.type(screen.getByLabelText("Nueva contraseña"), "nueva123");
  await userEvent.type(screen.getByLabelText("Confirmar nueva contraseña"), "nueva123");
  await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

  expect(
    await screen.findByText("La contraseña actual no es correcta."),
  ).toBeInTheDocument();
});

test('negativo: otro fallo al cambiar contraseña -> 500 -> "No se pudo cambiar tu contraseña."', async () => {
  mockGetMe();
  server.use(
    rest.put("http://localhost:4001/api/users/me/password", (req, res, ctx) => res(ctx.status(500))),
  );

  render(<Settings />);
  await screen.findByLabelText("Nombre");

  await userEvent.type(screen.getByLabelText("Contraseña actual"), "actual123");
  await userEvent.type(screen.getByLabelText("Nueva contraseña"), "nueva123");
  await userEvent.type(screen.getByLabelText("Confirmar nueva contraseña"), "nueva123");
  await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

  expect(await screen.findByText("No se pudo cambiar tu contraseña.")).toBeInTheDocument();
});

test('negativo: fallo al cargar -> GET /api/users/me 500 -> "No se pudo cargar tu información." y no se renderizan los formularios', async () => {
  server.use(
    rest.get("http://localhost:4001/api/users/me", (req, res, ctx) => res(ctx.status(500))),
  );

  render(<Settings />);

  expect(await screen.findByText("No se pudo cargar tu información.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
});
