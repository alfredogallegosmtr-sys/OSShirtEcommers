import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

test("happy: renderiza children, dispara onClick y aplica type=\"button\" por defecto", async () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Guardar</Button>);

  const button = screen.getByRole("button", { name: "Guardar" });
  expect(button).toHaveAttribute("type", "button");

  await userEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("negativo: disabled -> el botón está deshabilitado y el click no dispara onClick", async () => {
  const onClick = jest.fn();
  render(
    <Button onClick={onClick} disabled>
      Guardar
    </Button>,
  );

  const button = screen.getByRole("button", { name: "Guardar" });
  expect(button).toBeDisabled();

  await userEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

// B-14 (cerrado): Button reenvía props extra (`{...rest}`) al <button> real.
// Se cubre aquí explícitamente porque este mismo archivo es el que B-14
// corrigió, aunque el caso puntual ya se ejercita indirectamente en los
// tests de Checkout/CartView.
test("happy: reenvía props extra (title) al <button> real", () => {
  render(<Button title="Explicación del botón">Pagar</Button>);

  expect(screen.getByRole("button", { name: "Pagar" })).toHaveAttribute(
    "title",
    "Explicación del botón",
  );
});
