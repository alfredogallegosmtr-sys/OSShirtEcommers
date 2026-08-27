import { render, screen } from "@testing-library/react";
import Loading from "./Loading";

test('happy: renderiza el spinner con aria-label="Cargando" y el texto pasado como children', () => {
  render(<Loading>Cargando productos...</Loading>);

  expect(screen.getByLabelText("Cargando")).toBeInTheDocument();
  expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
});
