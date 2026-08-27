import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { rest } from "msw";
import { server } from "../../mocks/server";
import { AuthProvider } from "../../context/AuthContext";
import Navigation from "./Navigation";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function mockCategories(categories) {
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) =>
      res(ctx.status(200), ctx.json(categories)),
    ),
  );
}

function renderNav(props = {}, { authenticated = false } = {}) {
  if (authenticated) {
    localStorage.setItem(
      "authToken",
      makeToken({ userId: "u1", name: "Ana Pérez", role: "customer", exp: 9999999999 }),
    );
  }
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Navigation {...props} />
      </MemoryRouter>
    </AuthProvider>,
  );
}

const categoriesFixture = [
  { _id: "root1", name: "Ropa" },
  { _id: "root2", name: "Accesorios" },
  { _id: "sub2", name: "Gorras", parentCategory: { _id: "root2" } },
  { _id: "sub1", name: "Camisetas", parentCategory: { _id: "root1" } },
  { _id: "sub3", name: "Botas", parentCategory: { _id: "root1" } },
];

afterEach(() => {
  localStorage.clear();
});

test("happy escritorio: al abrir Todas las categorías se listan solo las raíces y sus subcategorías ordenadas alfabéticamente, enlazadas a /category/:id", async () => {
  mockCategories(categoriesFixture);
  renderNav();

  // Esperar a que las categorías terminen de cargar antes de abrir el
  // desplegable: si no, el click ocurre mientras loading:true y el
  // desplegable se abre mostrando "Cargando categorías...". El panel
  // transitorio (drawer) ya tiene "Ropa" en el DOM aunque esté
  // aria-hidden, así que sirve como señal de que la carga terminó
  // (getByText no filtra por aria-hidden, a diferencia de getByRole).
  await screen.findByText("Ropa");
  await userEvent.click(screen.getByRole("button", { name: "Todas las categorías" }));

  const dropdown = document.querySelector(".categories-dropdown-menu");
  const { getByRole, getAllByRole } = within(dropdown);

  expect(getByRole("link", { name: "Ropa" })).toHaveAttribute("href", "/category/root1");
  expect(getByRole("link", { name: "Accesorios" })).toHaveAttribute("href", "/category/root2");
  // Solo las raíces cuentan como category-group de nivel principal: 2 grupos.
  expect(getAllByRole("link", { name: /Ropa|Accesorios/ })).toHaveLength(2);

  const camisetasLink = getByRole("link", { name: "Camisetas" });
  expect(camisetasLink).toHaveAttribute("href", "/category/sub1");

  // Orden alfabético de subcategorías bajo la misma raíz: "Botas" antes que "Camisetas".
  const subcategoryLinks = getAllByRole("link", { name: /Botas|Camisetas/ });
  expect(subcategoryLinks.map((el) => el.textContent)).toEqual(["Botas", "Camisetas"]);
});

test("happy panel lateral: una categoría con subcategorías se expande/colapsa (aria-expanded); una sin subcategorías es enlace directo", async () => {
  mockCategories(categoriesFixture);
  renderNav();

  // El contenido del panel transitorio (drawer) está siempre montado pero
  // aria-hidden mientras está cerrado; getByRole excluye por defecto los
  // elementos inaccesibles, así que hace falta { hidden: true } para
  // encontrarlo sin necesidad de abrir el drawer primero (abrirlo no cambia
  // el comportamiento de expandir/colapsar que este caso prueba).
  const ropaButton = await screen.findByRole("button", { name: "Ropa", hidden: true });
  expect(ropaButton).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("link", { name: "Camisetas", hidden: true }),
  ).not.toBeInTheDocument();

  await userEvent.click(ropaButton);
  expect(ropaButton).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: "Camisetas", hidden: true })).toBeInTheDocument();

  await userEvent.click(ropaButton);
  expect(ropaButton).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("link", { name: "Camisetas", hidden: true }),
  ).not.toBeInTheDocument();
});

test("happy cerrar con Escape: con el drawer abierto, Escape lo cierra", async () => {
  mockCategories([]);
  renderNav();

  await userEvent.click(screen.getByRole("button", { name: /abrir todas las categorías/i }));
  const dialog = screen.getByRole("dialog", { hidden: true, name: /todas las categorías/i });
  expect(dialog).toHaveAttribute("aria-hidden", "false");

  await userEvent.keyboard("{Escape}");
  expect(dialog).toHaveAttribute("aria-hidden", "true");
});

test('negativo: error al cargar categorías (500) -> "No pudimos cargar las categorías." en el drawer, el desplegable y la versión móvil', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) => res(ctx.status(500))),
  );
  renderNav();

  // El contenido del panel transitorio (drawer) está siempre montado.
  expect(await screen.findByText("No pudimos cargar las categorías.")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Todas las categorías" }));
  expect(screen.getAllByText("No pudimos cargar las categorías.").length).toBeGreaterThan(1);
});

test('negativo: error al cargar categorías (500) en versión móvil -> "No pudimos cargar las categorías."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) => res(ctx.status(500))),
  );
  renderNav({ isMobile: true });

  expect(await screen.findByText("No pudimos cargar las categorías.")).toBeInTheDocument();
});

test("negativo: sin categorías ([]) -> no se listan categorías, pero los enlaces fijos siguen presentes", async () => {
  mockCategories([]);
  renderNav();

  await screen.findByRole("button", { name: "Todas las categorías" });
  expect(screen.queryByRole("button", { name: "Ropa" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ofertas del día" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Novedades" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Más vendidos" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Flash sale" })).toBeInTheDocument();
});

test("happy móvil: con isMobile solo hay enlaces planos; al pulsar uno se invoca onLinkClick", async () => {
  const onLinkClick = jest.fn();
  mockCategories([{ _id: "root1", name: "Ropa" }]);
  renderNav({ isMobile: true, onLinkClick });

  expect(screen.getByRole("link", { name: "Ofertas del día" })).toBeInTheDocument();
  const ropaLink = await screen.findByRole("link", { name: "Ropa" });
  expect(ropaLink).toHaveAttribute("href", "/category/root1");
  // Sin drawer ni dropdown en la versión móvil.
  expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();

  await userEvent.click(ropaLink);
  expect(onLinkClick).toHaveBeenCalledTimes(1);
});

test('negativo: saludo de invitado - sin sesión "Hola, Inicia sesión"; con sesión "Hola, <primer nombre>"', async () => {
  mockCategories([]);
  renderNav();
  expect(await screen.findByText("Hola, Inicia sesión")).toBeInTheDocument();
});

test('negativo: saludo con sesión activa muestra "Hola, <primer nombre>"', async () => {
  mockCategories([]);
  renderNav({}, { authenticated: true });
  expect(await screen.findByText("Hola, Ana")).toBeInTheDocument();
});

test('happy loading: mientras cargan las categorías se ve "Cargando categorías..."', async () => {
  server.use(
    rest.get("http://localhost:4001/api/categories", (req, res, ctx) =>
      res(ctx.delay(50), ctx.status(200), ctx.json([])),
    ),
  );
  renderNav();

  expect(await screen.findByText("Cargando categorías...")).toBeVisible();
});
