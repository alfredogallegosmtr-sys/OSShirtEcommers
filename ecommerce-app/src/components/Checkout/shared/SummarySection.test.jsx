import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SummarySection from "./SummarySection";

test("happy expandido: isExpanded renderiza los children y no el resumen", () => {
  render(
    <SummarySection title="Dirección" selected={{ id: 1 }} isExpanded onToggle={jest.fn()}>
      <div>contenido del formulario</div>
    </SummarySection>,
  );

  expect(screen.getByText("contenido del formulario")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
});

test('negativo: colapsado con selección -> se ve summaryContent, el botón "Cambiar" y la marca "✓", no los children', () => {
  render(
    <SummarySection
      title="Dirección"
      selected={{ id: 1 }}
      summaryContent={<span>Calle 1, CDMX</span>}
      isExpanded={false}
      onToggle={jest.fn()}
    >
      <div>contenido del formulario</div>
    </SummarySection>,
  );

  expect(screen.getByText("Calle 1, CDMX")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cambiar" })).toBeInTheDocument();
  expect(screen.getByText("✓")).toBeInTheDocument();
  expect(screen.queryByText("contenido del formulario")).not.toBeInTheDocument();
});

test("negativo: colapsado sin selección -> no se muestra el resumen ni la marca", () => {
  render(
    <SummarySection
      title="Dirección"
      selected={null}
      summaryContent={<span>Calle 1, CDMX</span>}
      isExpanded={false}
      onToggle={jest.fn()}
    >
      <div>contenido del formulario</div>
    </SummarySection>,
  );

  expect(screen.queryByText("Calle 1, CDMX")).not.toBeInTheDocument();
  expect(screen.queryByText("✓")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
});

test('negativo: click sobre "Cambiar" invoca onToggle una sola vez (el header ignora clicks en botones)', async () => {
  const onToggle = jest.fn();
  render(
    <SummarySection
      title="Dirección"
      selected={{ id: 1 }}
      summaryContent={<span>Calle 1, CDMX</span>}
      isExpanded={false}
      onToggle={onToggle}
    >
      <div>contenido del formulario</div>
    </SummarySection>,
  );

  await userEvent.click(screen.getByRole("button", { name: "Cambiar" }));

  expect(onToggle).toHaveBeenCalledTimes(1);
});
