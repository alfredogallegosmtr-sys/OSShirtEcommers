import { render, screen } from "@testing-library/react";
import RegisterErrorMessage from "./RegisterErrorMessage";

test('happy: kind="NETWORK" -> mensaje de conexión', () => {
  render(<RegisterErrorMessage kind="NETWORK" />);
  expect(
    screen.getByText("No pudimos conectar con el servidor. Revisa tu conexión a internet."),
  ).toBeInTheDocument();
});

test("negativo: TIMEOUT -> mismo mensaje que NETWORK", () => {
  render(<RegisterErrorMessage kind="TIMEOUT" />);
  expect(
    screen.getByText("No pudimos conectar con el servidor. Revisa tu conexión a internet."),
  ).toBeInTheDocument();
});

test("negativo: SERVER_ERROR -> mensaje de error del servidor", () => {
  render(<RegisterErrorMessage kind="SERVER_ERROR" />);
  expect(
    screen.getByText("Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos."),
  ).toBeInTheDocument();
});

test("negativo: BAD_REQUEST -> mensaje de datos inválidos", () => {
  render(<RegisterErrorMessage kind="BAD_REQUEST" />);
  expect(
    screen.getByText("Los datos enviados no son válidos. Revisa los campos."),
  ).toBeInTheDocument();
});

test.each([["UNAUTHORIZED"], [undefined]])(
  'negativo: kind desconocido (%s) -> mensaje genérico de error inesperado',
  (kind) => {
    render(<RegisterErrorMessage kind={kind} />);
    expect(
      screen.getByText(/Ocurrió un error inesperado al ejecutar tu petición/),
    ).toBeInTheDocument();
  },
);
