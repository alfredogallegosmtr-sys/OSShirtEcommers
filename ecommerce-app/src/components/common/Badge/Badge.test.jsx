import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

test("happy: renderiza el text recibido", () => {
  render(<Badge text="Nuevo" />);

  expect(screen.getByText("Nuevo")).toBeInTheDocument();
});
