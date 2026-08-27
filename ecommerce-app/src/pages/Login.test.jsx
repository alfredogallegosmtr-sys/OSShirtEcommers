import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Login from "./Login";

// Envoltorio sin lógica propia (ver TEST_PLAN.md): un único caso que confirma
// que monta LoginForm en la ruta real. Las reglas de negocio del formulario
// viven en LoginForm y ya están cubiertas en LoginForm.test.jsx.
test("happy: Login monta LoginForm en la ruta /login", () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

  expect(screen.getByRole("heading", { name: "Iniciar Sesión" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email:")).toBeInTheDocument();
});
