import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressList from "./AddressList";

const address = (overrides = {}) => ({
  _id: "a1",
  address: "Calle 1",
  city: "CDMX",
  state: "CDMX",
  postalCode: "01000",
  country: "México",
  phone: "5555555555",
  ...overrides,
});

test('happy: con N elementos se renderizan N ítems y el seleccionado aparece como "Seleccionada"; "Agregar Nueva Dirección" invoca onAdd', async () => {
  const onAdd = jest.fn();
  const addresses = [address(), address({ _id: "a2", address: "Calle 2" })];

  render(
    <AddressList
      addresses={addresses}
      selectedAddress={addresses[1]}
      onSelect={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onAdd={onAdd}
    />,
  );

  expect(screen.getByText("Calle 1")).toBeInTheDocument();
  expect(screen.getByText("Calle 2")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Seleccionar" })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Seleccionada" })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /agregar nueva dirección/i }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

test("negativo: lista vacía -> solo el encabezado y el botón de alta, sin ítems", () => {
  render(
    <AddressList
      addresses={[]}
      selectedAddress={null}
      onSelect={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
      onAdd={jest.fn()}
    />,
  );

  expect(screen.getByRole("heading", { name: "Direcciones de Envío" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /agregar nueva dirección/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Seleccionar" })).not.toBeInTheDocument();
});
