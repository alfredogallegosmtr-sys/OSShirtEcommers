import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressForm from "./AddressForm";

async function fillRequiredFields(overrides = {}) {
  const values = {
    address: "Calle 1",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "México",
    phone: "5555555555",
    ...overrides,
  };
  if (values.address) await userEvent.type(screen.getByLabelText("Dirección"), values.address);
  if (values.city) await userEvent.type(screen.getByLabelText("Ciudad"), values.city);
  if (values.state) await userEvent.type(screen.getByLabelText("Estado"), values.state);
  if (values.postalCode)
    await userEvent.type(screen.getByLabelText("Código Postal"), values.postalCode);
  if (values.country) await userEvent.type(screen.getByLabelText("País"), values.country);
  if (values.phone) await userEvent.type(screen.getByLabelText("Teléfono"), values.phone);
}

test('happy alta: rellenar y enviar -> onSubmit recibe los valores con addressType:"home" e isDefault:false, y el formulario queda limpio', async () => {
  const onSubmit = jest.fn();
  render(<AddressForm onSubmit={onSubmit} />);

  await fillRequiredFields();
  await userEvent.click(screen.getByRole("button", { name: "Agregar Dirección" }));

  expect(onSubmit).toHaveBeenCalledWith({
    address: "Calle 1",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "México",
    phone: "5555555555",
    addressType: "home",
    isDefault: false,
  });
  expect(screen.getByLabelText("Dirección")).toHaveValue("");
});

// NOTA (no automatizado): el caso "campos requeridos - enviar con Dirección
// vacía bloquea el envío (required) y onSubmit no se ejecuta" no se pudo
// automatizar con este stack. jsdom 16.7 (el que trae react-scripts 5) no
// implementa la validación de restricciones del formulario (constraint
// validation API) al disparar el evento `submit`: un `<input required>`
// vacío no impide que el `submit` handler corra. Verificado empíricamente
// corriendo este mismo test: con "Dirección" vacía, `onSubmit` SÍ se invocó
// (payload con `address: ""`), pese al atributo `required` estar realmente
// presente en el DOM (confirmado leyendo el render). En un navegador real
// esto sí bloquea el envío; en jsdom no hay forma de observarlo sin mockear
// `HTMLFormElement.prototype.reportValidity`/`checkValidity`, fuera del
// alcance de "solo interceptar con MSW".

test('happy edición: con initialValues e isEdit -> título "Editar Dirección", campos precargados, botón "Guardar Cambios" y el formulario no se limpia tras enviar', async () => {
  const onSubmit = jest.fn();
  const initialValues = {
    address: "Calle Vieja",
    city: "GDL",
    state: "JAL",
    postalCode: "44100",
    country: "México",
    phone: "3333333333",
  };
  render(<AddressForm onSubmit={onSubmit} isEdit initialValues={initialValues} />);

  expect(screen.getByRole("heading", { name: "Editar Dirección" })).toBeInTheDocument();
  expect(screen.getByLabelText("Dirección")).toHaveValue("Calle Vieja");

  await userEvent.click(screen.getByRole("button", { name: "Guardar Cambios" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ address: "Calle Vieja" }));
  // No se limpia tras enviar en modo edición.
  expect(screen.getByLabelText("Dirección")).toHaveValue("Calle Vieja");
});

test("happy predeterminada: marcar el checkbox -> onSubmit recibe isDefault: true", async () => {
  const onSubmit = jest.fn();
  render(<AddressForm onSubmit={onSubmit} />);

  await fillRequiredFields();
  await userEvent.click(screen.getByLabelText("Establecer como dirección predeterminada"));
  await userEvent.click(screen.getByRole("button", { name: "Agregar Dirección" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ isDefault: true }));
});

test('happy cancelar: con onCancel aparece "Cancelar" y al pulsarlo se invoca; sin onCancel el botón no se renderiza', async () => {
  const onCancel = jest.fn();
  const { rerender } = render(<AddressForm onSubmit={jest.fn()} onCancel={onCancel} />);

  await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(onCancel).toHaveBeenCalledTimes(1);

  rerender(<AddressForm onSubmit={jest.fn()} />);
  expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
});
