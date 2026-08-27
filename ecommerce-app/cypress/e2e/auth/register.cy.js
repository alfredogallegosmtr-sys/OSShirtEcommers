import { buildUniqueUser } from "../../utils/testData";

// Flujo real: RegisterForm.jsx -> POST /api/auth/register -> navega a /login con
// state {justRegistered:true, email} -> LoginForm.jsx muestra el mensaje de éxito y
// precarga el email. El registro NUNCA deja la sesión iniciada (no hay token en la
// respuesta de /register) -- se confirma ese comportamiento real, no se asume otro.

describe("Registro (/register)", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("renderiza el formulario completo", () => {
    cy.findByRole("heading", { name: /crear cuenta/i }).should("be.visible");
    cy.findByLabelText(/nombre completo/i).should("be.visible");
    cy.findByLabelText(/^email/i).should("be.visible");
    cy.findByLabelText(/^contraseña/i).should("be.visible");
    cy.findByLabelText(/confirmar contraseña/i).should("be.visible");
    cy.findByRole("button", { name: /crear cuenta/i }).should("be.visible");
    cy.findByRole("link", { name: /inicia sesión/i }).should("have.attr", "href", "/login");
  });

  it("[negativo] campos obligatorios vacíos -> muestra validación y no envía la petición", () => {
    cy.intercept("POST", "**/api/auth/register").as("registerRequest");

    cy.findByRole("button", { name: /crear cuenta/i }).click();

    cy.findByText("El nombre es requerido").should("be.visible");
    cy.findByText("El email es requerido").should("be.visible");
    cy.findByText("El password es requerido").should("be.visible");
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("[negativo] correo con formato inválido -> muestra el mensaje y no envía la petición", () => {
    cy.intercept("POST", "**/api/auth/register").as("registerRequest");
    const user = buildUniqueUser();

    cy.findByLabelText(/nombre completo/i).type(user.name);
    cy.findByLabelText(/^email/i).type("correo-invalido");
    cy.findByLabelText(/^contraseña/i).type(user.password);
    cy.findByLabelText(/confirmar contraseña/i).type(user.password);
    cy.findByRole("button", { name: /crear cuenta/i }).click();

    cy.findByText("El email no tiene un formato válido").should("be.visible");
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("[negativo] contraseñas que no coinciden -> muestra el mensaje y no envía la petición", () => {
    cy.intercept("POST", "**/api/auth/register").as("registerRequest");
    const user = buildUniqueUser();

    cy.findByLabelText(/nombre completo/i).type(user.name);
    cy.findByLabelText(/^email/i).type(user.email);
    cy.findByLabelText(/^contraseña/i).type(user.password);
    cy.findByLabelText(/confirmar contraseña/i).type("otra-contraseña-1");
    cy.findByRole("button", { name: /crear cuenta/i }).click();

    cy.findByText("Las contraseñas no coinciden").should("be.visible");
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("[happy] registro exitoso -> 201, navega a /login con el mensaje de éxito y el email precargado", () => {
    cy.intercept("POST", "**/api/auth/register").as("registerRequest");
    const user = buildUniqueUser();

    cy.findByLabelText(/nombre completo/i).type(user.name);
    cy.findByLabelText(/^email/i).type(user.email);
    cy.findByLabelText(/^contraseña/i).type(user.password);
    cy.findByLabelText(/confirmar contraseña/i).type(user.password);
    cy.findByRole("button", { name: /crear cuenta/i }).click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 201);

    cy.location("pathname").should("eq", "/login");
    cy.findByText("Cuenta creada exitosamente. Inicia sesión con tu email y contraseña").should(
      "be.visible",
    );
    cy.findByLabelText(/email/i).should("have.value", user.email);
    // El registro no inicia sesión por sí solo -- confirma el comportamiento real.
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.null;
    });
  });

  it("[negativo] email ya registrado -> muestra el error del backend y no deja el botón cargando", () => {
    const user = buildUniqueUser();
    cy.intercept("POST", "**/api/auth/register").as("registerFirst");

    // Registra el usuario una vez para garantizar el duplicado, sin pasar por la UI.
    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/register`,
      body: { name: user.name, email: user.email, password: user.password },
    }).its("status").should("eq", 201);

    cy.reload();
    cy.intercept("POST", "**/api/auth/register").as("registerDuplicate");

    cy.findByLabelText(/nombre completo/i).type(user.name);
    cy.findByLabelText(/^email/i).type(user.email);
    cy.findByLabelText(/^contraseña/i).type(user.password);
    cy.findByLabelText(/confirmar contraseña/i).type(user.password);
    cy.findByRole("button", { name: /crear cuenta/i }).click();

    cy.wait("@registerDuplicate").its("response.statusCode").should("eq", 422);
    cy.findByText("Este email ya está registrado").should("be.visible");
    // El botón vuelve a su texto normal -- no se queda en "Creando cuenta..." para siempre.
    cy.findByRole("button", { name: /^crear cuenta$/i }).should("be.enabled");
  });
});
