// Flujo real: LoginForm.jsx -> POST /api/auth/login -> AuthContext guarda el token en
// localStorage["authToken"] (sin cookies, sin sessionStorage) -> navega a "/" (o a
// state.from si viene de una ruta protegida). LoginForm solo usa validación HTML5 nativa
// (atributo `required`, sin mensajes JS propios) -- por eso las validaciones se verifican
// contra el bloqueo real del navegador, no contra un texto de error que no existe.

const TEST_EMAIL = Cypress.env("testUserEmail");
const TEST_PASSWORD = Cypress.env("testUserPassword");

describe("Login (/login)", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("renderiza el formulario completo", () => {
    cy.findByRole("heading", { name: /iniciar sesión/i }).should("be.visible");
    cy.findByLabelText(/email/i).should("be.visible");
    cy.findByLabelText(/contraseña/i).should("be.visible");
    cy.findByRole("button", { name: /iniciar sesión/i }).should("be.visible");
    cy.findByRole("link", { name: /regístrate/i }).should("have.attr", "href", "/register");
    // No existe un enlace de recuperación de contraseña en este formulario real -- no se
    // inventa uno (ver LoginForm.jsx).
  });

  it("[negativo] campos vacíos -> el navegador bloquea el envío (HTML5 required) y no se hace la petición", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.findByRole("button", { name: /iniciar sesión/i }).click();

    cy.findByLabelText(/email/i).then(($input) => {
      expect($input[0].checkValidity(), "el campo email debe quedar marcado inválido").to.be.false;
    });
    cy.location("pathname").should("eq", "/login");
    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("[negativo] correo con formato inválido -> el navegador bloquea el envío y no se hace la petición", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.findByLabelText(/email/i).type("correo-invalido");
    cy.findByLabelText(/contraseña/i).type("cualquier-cosa");
    cy.findByRole("button", { name: /iniciar sesión/i }).click();

    cy.findByLabelText(/email/i).then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
    });
    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("[negativo] contraseña vacía -> el navegador bloquea el envío y no se hace la petición", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.findByLabelText(/email/i).type(TEST_EMAIL);
    cy.findByRole("button", { name: /iniciar sesión/i }).click();

    cy.findByLabelText(/contraseña/i).then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
    });
    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("[negativo] credenciales incorrectas -> 401, mensaje visible, sin sesión y el botón deja de mostrar carga", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.findByLabelText(/email/i).type(TEST_EMAIL);
    cy.findByLabelText(/contraseña/i).type("password-incorrecto-123");
    cy.findByRole("button", { name: /iniciar sesión/i }).click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 401);
    cy.findByText("Email o contraseña incorrectos").should("be.visible");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.null;
    });
    cy.findByRole("button", { name: /^iniciar sesión$/i }).should("be.enabled");
  });

  it("[happy] login exitoso -> redirige a /, muestra el usuario y guarda la sesión", () => {
    cy.intercept("POST", "**/api/auth/login").as("loginRequest");

    cy.findByLabelText(/email/i).type(TEST_EMAIL);
    cy.findByLabelText(/contraseña/i).type(TEST_PASSWORD);
    cy.findByRole("button", { name: /iniciar sesión/i }).click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/");
    cy.findByText(/hola, user 4/i).should("be.visible");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.a("string");
    });
  });

  it("[happy] persistencia de sesión: sobrevive a un reload y permite entrar a una ruta protegida", () => {
    cy.loginByApi();
    cy.visit("/");
    cy.findByText(/hola, user 4/i).should("be.visible");

    cy.reload();
    cy.findByText(/hola, user 4/i).should("be.visible");

    cy.visit("/orders");
    cy.location("pathname").should("eq", "/orders");
  });

  it("[negativo] sin sesión, una ruta protegida redirige a /login sin mostrar datos privados", () => {
    cy.clearAllLocalStorage();

    cy.visit("/orders");

    cy.location("pathname").should("eq", "/login");
    cy.findByText(/mis pedidos/i).should("not.exist");
  });
});
