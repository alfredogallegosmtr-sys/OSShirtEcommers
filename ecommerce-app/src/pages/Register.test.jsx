import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Register from "./Register";

// Envoltorio sin lógica propia (ver TEST_PLAN.md): un único caso que confirma
// que monta RegisterForm en la ruta real. Las reglas del formulario ya están
// cubiertas en RegisterForm.test.jsx.
test("happy: Register monta RegisterForm en la ruta /register", () => {
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre completo *")).toBeInTheDocument();
});
