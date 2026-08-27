import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentItem from "./PaymentItem";

const basePayment = {
  _id: "p1",
  brand: "visa",
  last4: "4242",
  expiryDate: "12/28",
  cardHolderName: "Ana Pérez",
};

test("happy: muestra marca, **** last4, vencimiento y titular, e invoca onSelect/onEdit/onDelete con el elemento", async () => {
  const onSelect = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(
    <PaymentItem
      payment={basePayment}
      isSelected={false}
      onSelect={onSelect}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );

  expect(screen.getByText("Visa")).toBeInTheDocument();
  expect(screen.getByText("**** **** **** 4242")).toBeInTheDocument();
  expect(screen.getByText("Vence: 12/28")).toBeInTheDocument();
  expect(screen.getByText("Titular: Ana Pérez")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
  expect(onSelect).toHaveBeenCalledWith(basePayment);

  await userEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect(onEdit).toHaveBeenCalledWith(basePayment);

  await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
  expect(onDelete).toHaveBeenCalledWith(basePayment);
});

test('negativo: isSelected -> el botón dice "Seleccionada" y está deshabilitado', async () => {
  const onSelect = jest.fn();
  render(
    <PaymentItem
      payment={basePayment}
      isSelected
      onSelect={onSelect}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );

  const button = screen.getByRole("button", { name: "Seleccionada" });
  expect(button).toBeDisabled();

  await userEvent.click(button);
  expect(onSelect).not.toHaveBeenCalled();
});

test('negativo: isDefault -> aparece la etiqueta "Predeterminada"', () => {
  render(
    <PaymentItem
      payment={{ ...basePayment, isDefault: true }}
      isSelected={false}
      onSelect={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );

  expect(screen.getByText("Predeterminada")).toBeInTheDocument();
});

test('negativo: last4/brand ausentes -> "**** **** **** ----" y el título "Método de pago"', () => {
  render(
    <PaymentItem
      payment={{ expiryDate: "01/30", cardHolderName: "Juan Gómez" }}
      isSelected={false}
      onSelect={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );

  expect(screen.getByText("Método de pago")).toBeInTheDocument();
  expect(screen.getByText("**** **** **** ----")).toBeInTheDocument();
});
