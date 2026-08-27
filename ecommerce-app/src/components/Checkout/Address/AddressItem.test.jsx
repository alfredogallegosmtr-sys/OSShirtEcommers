import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressItem from "./AddressItem";

const baseAddress = {
  _id: "a1",
  address: "Av. Siempre Viva 742",
  city: "Springfield",
  state: "SP",
  postalCode: "12345",
  country: "Argentina",
  phone: "555-1234",
};

test("happy: muestra los datos de la dirección e invoca onSelect/onEdit/onDelete con el elemento", async () => {
  const onSelect = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(
    <AddressItem
      address={baseAddress}
      isSelected={false}
      onSelect={onSelect}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );

  expect(screen.getByText("Av. Siempre Viva 742")).toBeInTheDocument();
  expect(screen.getByText(/Springfield, SP — 12345/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Seleccionar" }));
  expect(onSelect).toHaveBeenCalledWith(baseAddress);

  await userEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect(onEdit).toHaveBeenCalledWith(baseAddress);

  await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
  expect(onDelete).toHaveBeenCalledWith(baseAddress);
});

test('negativo: isSelected -> el botón dice "Seleccionada" y está deshabilitado', async () => {
  const onSelect = jest.fn();
  render(
    <AddressItem
      address={baseAddress}
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
    <AddressItem
      address={{ ...baseAddress, isDefault: true }}
      isSelected={false}
      onSelect={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );

  expect(screen.getByText("Predeterminada")).toBeInTheDocument();
});
