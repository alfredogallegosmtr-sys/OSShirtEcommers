import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentForm from "./PaymentForm";

test('happy alta: número "4111111111111111", titular y "12/28" -> onSubmit recibe type/cardHolderName/expiryDate/isDefault/last4/brand', async () => {
  const onSubmit = jest.fn();
  render(<PaymentForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/número de tarjeta/i), "4111111111111111");
  await userEvent.type(screen.getByLabelText(/nombre del titular/i), "Ana Pérez");
  await userEvent.type(screen.getByLabelText(/fecha de expiración/i), "12/28");
  await userEvent.click(screen.getByRole("button", { name: "Agregar Método de Pago" }));

  expect(onSubmit).toHaveBeenCalledWith({
    type: "credit_card",
    cardHolderName: "Ana Pérez",
    expiryDate: "12/28",
    isDefault: false,
    last4: "1111",
    brand: "visa",
  });
});

test("negativo: el payload nunca incluye cardNumber ni cvv (regla S-03)", async () => {
  const onSubmit = jest.fn();
  render(<PaymentForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/número de tarjeta/i), "4111111111111111");
  await userEvent.type(screen.getByLabelText(/nombre del titular/i), "Ana");
  await userEvent.type(screen.getByLabelText(/fecha de expiración/i), "12/28");
  await userEvent.click(screen.getByRole("button", { name: "Agregar Método de Pago" }));

  const payload = onSubmit.mock.calls[0][0];
  expect(payload).not.toHaveProperty("cardNumber");
  expect(payload).not.toHaveProperty("cvv");
});

test('negativo: número con menos de 4 dígitos -> el payload no incluye last4 ni brand', async () => {
  const onSubmit = jest.fn();
  render(<PaymentForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/número de tarjeta/i), "12");
  await userEvent.type(screen.getByLabelText(/nombre del titular/i), "Ana");
  await userEvent.type(screen.getByLabelText(/fecha de expiración/i), "12/28");
  await userEvent.click(screen.getByRole("button", { name: "Agregar Método de Pago" }));

  const payload = onSubmit.mock.calls[0][0];
  expect(payload).not.toHaveProperty("last4");
  expect(payload).not.toHaveProperty("brand");
});

test.each([
  ["5111111111111111", "mastercard"],
  ["341111111111111", "amex"],
  ["6011111111111117", "other"],
])('happy marcas: número que empieza con %s -> brand:"%s"', async (cardNumber, brand) => {
  const onSubmit = jest.fn();
  render(<PaymentForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/número de tarjeta/i), cardNumber);
  await userEvent.type(screen.getByLabelText(/nombre del titular/i), "Ana");
  await userEvent.type(screen.getByLabelText(/fecha de expiración/i), "12/28");
  await userEvent.click(screen.getByRole("button", { name: "Agregar Método de Pago" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ brand }));
});

test('happy edición: con initialValues.last4 e isEdit -> campo muestra **** **** **** 1234, título "Editar Método de Pago" y el número no es obligatorio', () => {
  render(
    <PaymentForm
      onSubmit={jest.fn()}
      isEdit
      initialValues={{ last4: "1234", cardHolderName: "Ana", expiryDate: "12/28", isDefault: true }}
    />,
  );

  expect(screen.getByRole("heading", { name: "Editar Método de Pago" })).toBeInTheDocument();
  expect(screen.getByLabelText(/número de tarjeta/i)).toHaveValue("**** **** **** 1234");
  expect(screen.getByLabelText(/número de tarjeta/i)).not.toBeRequired();
});

// HALLAZGO MENOR (no arreglado aquí, cosmético/de consola, sin impacto
// funcional real): PaymentForm.jsx pasa `placeHolder` (con H mayúscula) en
// vez de `placeholder` a <Input> en "Número de tarjeta" y "Fecha de
// expiración" (líneas 89 y 110 de PaymentForm.jsx). Input.jsx solo
// desestructura `placeholder` en minúscula y reenvía el resto vía
// `{...rest}`, así que `placeHolder` llega al <input> como un atributo React
// no reconocido -de ahí el warning en consola "Invalid DOM property
// `placeHolder`. Did you mean `placeholder`?" que se ve en este archivo-.
// Se verificó empíricamente antes de reportarlo como bug real: los nombres
// de atributo HTML no distinguen mayúsculas/minúsculas, así que el DOM
// termina exponiendo igual el atributo como `placeholder` con el valor
// correcto (confirmado leyendo `input.getAttribute("placeholder")` abajo) -
// el usuario sí ve el texto de ayuda. Es puramente un warning de linting en
// modo desarrollo de React, no un bug funcional.
test('hallazgo menor: PaymentForm.jsx usa placeHolder (no placeholder) -> warning de React en consola, sin romper el atributo real', () => {
  render(<PaymentForm onSubmit={jest.fn()} />);

  const input = screen.getByLabelText(/número de tarjeta/i);
  // El HTML normaliza el nombre del atributo a minúsculas pese al typo de
  // casing en la prop, así que el valor sí llega correctamente al usuario.
  expect(input).toHaveAttribute("placeholder", "1234 5678 9012 3456");
});

// NOTA (no automatizado): el caso "campos requeridos en alta - sin isEdit,
// enviar con el número vacío bloquea el envío (required) y onSubmit no
// corre" no se pudo automatizar con este stack, por la misma razón que en
// AddressForm.test.jsx: jsdom 16.7 no implementa la constraint validation
// API sobre `submit` (un `<input required>` vacío no impide que el handler
// corra). Verificado empíricamente: con el número de tarjeta vacío,
// `onSubmit` SÍ se invocó (payload sin `last4`/`brand`, como es de esperar,
// pero sí se invocó).
