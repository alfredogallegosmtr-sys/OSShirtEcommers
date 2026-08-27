import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

test('happy: con label e id, el label queda asociado (getByLabelText) y onChange recibe lo tecleado', async () => {
  const onChange = jest.fn();
  render(
    <Input label="Nombre" id="name" value="" onChange={onChange} />,
  );

  const input = screen.getByLabelText("Nombre");
  await userEvent.type(input, "a");

  expect(onChange).toHaveBeenCalled();
});

test("negativo: sin prop label -> no se renderiza <label> y el input sigue siendo consultable por su placeholder", () => {
  render(
    <Input
      placeholder="Escribe aquí"
      value=""
      onChange={() => {}}
    />,
  );

  expect(document.querySelector("label")).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("Escribe aquí")).toBeInTheDocument();
});
