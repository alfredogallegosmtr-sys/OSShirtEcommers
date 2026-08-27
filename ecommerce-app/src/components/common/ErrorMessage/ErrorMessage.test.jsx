import { render, screen } from "@testing-library/react";
import ErrorMessage from "./ErrorMessage";

test("happy: renderiza el contenido pasado como children (texto)", () => {
  render(<ErrorMessage>Este campo es obligatorio</ErrorMessage>);

  expect(screen.getByText("Este campo es obligatorio")).toBeInTheDocument();
});

test("happy: renderiza nodos como children (contraparte de la regresión B-09, el mensaje llega por children, no por prop)", () => {
  render(
    <ErrorMessage>
      <strong>Error:</strong> credenciales inválidas
    </ErrorMessage>,
  );

  expect(screen.getByText("Error:")).toBeInTheDocument();
  expect(screen.getByText(/credenciales inválidas/)).toBeInTheDocument();
});
