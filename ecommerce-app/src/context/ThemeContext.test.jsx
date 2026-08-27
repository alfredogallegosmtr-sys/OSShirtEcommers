import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test('happy: app:theme="dark" en localStorage -> <html data-theme="dark">; toggleTheme lo cambia a light y persiste', async () => {
  localStorage.setItem("app:theme", "dark");

  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  );

  expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  expect(screen.getByTestId("theme")).toHaveTextContent("dark");

  await userEvent.click(screen.getByText("toggle"));

  expect(screen.getByTestId("theme")).toHaveTextContent("light");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(localStorage.getItem("app:theme")).toBe("light");
});

test('negativo: app:theme="banana" (valor no permitido) se ignora y se usa prefers-color-scheme (matches:false -> light)', () => {
  localStorage.setItem("app:theme", "banana");
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });

  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  );

  expect(screen.getByTestId("theme")).toHaveTextContent("light");
});

test("negativo: localStorage inaccesible (getItem/setItem lanzan) -> el provider igual renderiza con el tema del sistema", () => {
  const getItemSpy = jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  const setItemSpy = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });

  expect(() =>
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    ),
  ).not.toThrow();

  expect(screen.getByTestId("theme")).toHaveTextContent("light");

  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
});

test("negativo: useTheme() fuera de <ThemeProvider> lanza el error esperado", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  function Broken() {
    useTheme();
    return null;
  }
  expect(() => render(<Broken />)).toThrow(
    "useTheme must be used within a ThemeProvider",
  );
  consoleError.mockRestore();
});
