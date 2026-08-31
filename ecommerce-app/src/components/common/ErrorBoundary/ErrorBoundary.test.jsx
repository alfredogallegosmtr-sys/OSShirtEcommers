import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function Bomb() {
  throw new Error("boom");
}

test("muestra fallback y botón Recargar cuando un hijo lanza un error", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>,
  );
  expect(screen.getByText("Ocurrió un error al cargar esta página.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
  consoleError.mockRestore();
});

test("botón Recargar dispara window.location.reload", async () => {
  const reload = jest.fn();
  Object.defineProperty(window, "location", { value: { reload }, writable: true });
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Recargar" }));
  expect(reload).toHaveBeenCalled();
  consoleError.mockRestore();
});
