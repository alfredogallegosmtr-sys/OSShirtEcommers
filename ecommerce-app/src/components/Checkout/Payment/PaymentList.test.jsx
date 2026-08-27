import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentList from "./PaymentList";

const payment = (overrides = {}) => ({
  _id: "p1",
  type: "credit_card",
  cardHolderName: "Ana",
  last4: "1234",
  brand: "visa",
  expiryDate: "12/28",
  ...overrides,
});

test('happy: con N elementos se renderizan N ítems y el seleccionado aparece como "Seleccionada"; "Agregar Nueva Tarjeta" invoca onAdd', async () => {
  const onAdd = jest.fn();
  const payments = [payment(), payment({ _id: "p2", last4: "5678" })];

  render(
    <PaymentList
      payments={payments}
      selectedPayment={payments[0]}
      onSelect={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onAdd={onAdd}
    />,
  );

  expect(screen.getByText("**** **** **** 1234")).toBeInTheDocument();
  expect(screen.getByText("**** **** **** 5678")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Seleccionada" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Seleccionar" })).toHaveLength(1);

  await userEvent.click(screen.getByRole("button", { name: /agregar nueva tarjeta/i }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

test("negativo: lista vacía -> solo el encabezado y el botón de alta, sin ítems", () => {
  render(
    <PaymentList
      payments={[]}
      selectedPayment={null}
      onSelect={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onAdd={jest.fn()}
    />,
  );

  expect(screen.getByRole("heading", { name: "Métodos de Pago" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /agregar nueva tarjeta/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Seleccionar" })).not.toBeInTheDocument();
});
