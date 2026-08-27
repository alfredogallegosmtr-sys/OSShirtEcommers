import { render } from "@testing-library/react";
import Icon from "./Icon";

test("happy: con un name existente renderiza el svg correspondiente", () => {
  const { container } = render(<Icon name="heart" />);

  const svg = container.querySelector("svg");
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveAttribute("width", "20");
});

// Nota sobre el caso "negativo" del plan (`TEST_PLAN.md`: "name inexistente ->
// no renderiza icono y no lanza"): el comportamiento real difiere de esa
// descripción. `Icon.jsx` (línea `icons[name] || icons.user`) no deja de
// renderizar nada: cae al icono "user" como fallback. No es un bug (evita
// huecos visuales en vez de un <span> vacío), así que se documenta y se
// prueba el comportamiento real -> no lanza y SÍ renderiza un svg (el de
// "user"), no lo omite.
test("negativo: name inexistente -> no lanza y cae al icono 'user' como fallback (no queda vacío)", () => {
  const { container: withUnknown } = render(<Icon name="no-existe" />);
  const { container: withUser } = render(<Icon name="user" />);

  const unknownSvg = withUnknown.querySelector("svg");
  expect(unknownSvg).toBeInTheDocument();
  expect(unknownSvg.innerHTML).toBe(withUser.querySelector("svg").innerHTML);
});
