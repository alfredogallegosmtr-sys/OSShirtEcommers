// Comandos personalizados de Cypress para OSShirtEcommers.
//
// Contexto real verificado en el código (no supuesto):
// - Auth es JWT por header Authorization: Bearer <token>, sin cookies ni sessionStorage.
//   El token se guarda en localStorage["authToken"] (ver src/context/AuthContext.jsx).
// - POST /api/auth/login devuelve { token, refreshToken } (200) o 401 en credenciales
//   inválidas (ver src/services/authService.js, .claude/api-routes.md).
// - ProductDetails.jsx (src/components/ProductDetails/ProductDetails.jsx) NO tiene selector
//   de cantidad -- "Agregar al carrito" siempre agrega 1 unidad (addItem(product, 1)). Para
//   llegar a una cantidad > 1 hay que usar los botones +/- del carrito después.

/**
 * Inicia sesión directamente contra la API real (POST /api/auth/login), sin pasar por la
 * interfaz. Usa cy.session() para cachear la sesión entre tests del mismo run.
 *
 * Uso:
 *   cy.loginByApi(); // usa las credenciales por default de cypress.config.js
 *   cy.loginByApi({ email: "otro@test.com", password: "123456" });
 *
 * Después de llamar a este comando hay que visitar la ruta que se necesite
 * (cy.session no deja la app cargada, solo restaura localStorage/cookies).
 */
Cypress.Commands.add("loginByApi", (overrides = {}) => {
  const email = overrides.email || Cypress.env("testUserEmail");
  const password = overrides.password || Cypress.env("testUserPassword");
  const apiUrl = Cypress.env("apiUrl");

  cy.session(
    ["loginByApi", email],
    () => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/auth/login`,
        body: { email, password },
        // No logueamos el body de la request (contiene la contraseña).
        log: false,
        failOnStatusCode: false,
      }).then((response) => {
        expect(
          response.status,
          `loginByApi: POST /auth/login debería responder 200 (respondió ${response.status}). ` +
            "Revisa que el usuario exista en el seed y que la contraseña sea correcta.",
        ).to.eq(200);
        expect(response.body, "loginByApi: la respuesta debe incluir un token").to.have.property(
          "token",
        );

        cy.visit("/");
        cy.window().then((win) => {
          win.localStorage.setItem("authToken", response.body.token);
        });
      });
    },
    {
      validate() {
        cy.window().then((win) => {
          expect(win.localStorage.getItem("authToken"), "sesión restaurada").to.be.a("string");
        });
      },
    },
  );
});

/**
 * Agrega un producto al carrito a través de la interfaz real (visita la ficha de producto y
 * hace click en "Agregar al carrito"). Si no se pasa productId, toma el primer producto real
 * del catálogo vía la API (nunca inventa un id fijo, que podría no existir tras un re-seed).
 *
 * Como ProductDetails.jsx no tiene selector de cantidad, para quantity > 1 el comando visita
 * el carrito después y usa el botón "Aumentar cantidad" las veces necesarias -- refleja el
 * flujo real de la aplicación, no uno inventado.
 *
 * Uso:
 *   cy.addProductToCart(); // toma el primer producto del catálogo, cantidad 1
 *   cy.addProductToCart({ productId: "...", quantity: 2 });
 */
Cypress.Commands.add("addProductToCart", (overrides = {}) => {
  const { quantity = 1 } = overrides;
  const apiUrl = Cypress.env("apiUrl");

  const withProductId = (productId) => {
    cy.visit(`/product/${productId}`);
    cy.findByRole("button", { name: /agregar al carrito/i }).click();
    cy.findByTestId("cart-count").should("contain", "1");

    if (quantity > 1) {
      cy.visit("/cart");
      for (let i = 1; i < quantity; i += 1) {
        cy.findAllByLabelText(/aumentar cantidad/i).first().click();
      }
      cy.findByTestId("cart-count").should("contain", String(quantity));
    }

    return cy.wrap(productId);
  };

  if (overrides.productId) {
    return withProductId(overrides.productId);
  }

  return cy
    .request(`${apiUrl}/products`)
    .its("body.products")
    .then((products) => {
      expect(products.length, "el catálogo debe tener al menos un producto real para la prueba")
        .to.be.greaterThan(0);
      return withProductId(products[0]._id);
    });
});
