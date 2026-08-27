import { buildAddress, buildCard } from "../../utils/testData";

// Estructura REAL del checkout de esta app (verificado en Checkout.jsx, no un wizard de 4
// pasos como asume un checkout genérico):
//   - El carrito (/cart) es una página SEPARADA, antes de entrar a checkout.
//   - Checkout.jsx es una sola página con 3 secciones colapsables:
//       "1. Dirección de envío", "2. Método de pago", "3. Revisa tu pedido" (embebe CartView)
//     más un resumen fijo a la derecha con el botón "Confirmar y Pagar".
//   - No existe selección de "método de envío": el costo se calcula automático (gratis si
//     subtotal >= $1000, si no $350 — ver TAX_RATE/SHIPPING_RATE en Checkout.jsx).
//   - No existe una pasarela de pago externa real (S-03: PaymentMethod es un recurso propio,
//     nunca se transmite el número completo de tarjeta) -- no hay nada que mockear en sandbox.
// Las "4 fases" del prompt se mapean a estos 4 bloques funcionales reales:
//   Fase 1 -> página /cart · Fase 2 -> sección "Dirección de envío" · Fase 3 -> sección
//   "Método de pago" · Fase 4 -> resumen + "Confirmar y Pagar".

// SummarySection.jsx colapsa la sección apenas hay algo seleccionado (Checkout.jsx
// auto-selecciona isDefault, o si no hay ninguna con isDefault, la primera de la lista) --
// con datos preexistentes del usuario de prueba (reales, de sesiones de prueba anteriores),
// las secciones de dirección/pago pueden cargar YA colapsadas, con "Agregar Nueva
// Dirección"/"Agregar Nueva Tarjeta" ocultos hasta pulsar "Cambiar". Este helper deja la
// sección expandida sin asumir un estado inicial fijo -- necesario para que la prueba sea
// independiente de qué datos tenga ya el usuario semilla.
function ensureSectionExpanded(sectionTitle) {
  cy.contains(".summary-section", sectionTitle).then(($section) => {
    if ($section.find("button:contains('Cambiar')").length > 0) {
      cy.wrap($section).contains("button", "Cambiar").click();
    }
  });
}

describe("Checkout de punta a punta", () => {
  const createdAddressIds = [];
  const createdPaymentIds = [];

  beforeEach(() => {
    cy.loginByApi();
    // cy.session no deja la app cargada -- hay que visitar antes de tocar localStorage/cookies.
    cy.visit("/");
    // El carrito de este usuario semilla es HÍBRIDO (localStorage + servidor, ver
    // CartContext.jsx): con sesión, el carrito real vive en el backend y se sincroniza al
    // cargar la app. Limpiar solo localStorage no alcanza para dejar el carrito vacío entre
    // corridas -- hay que vaciar el carrito real del servidor también, o cada test heredaría
    // ítems de la corrida anterior (violaría independencia de pruebas).
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "DELETE",
        url: `${Cypress.env("apiUrl")}/cart`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    });
  });

  afterEach(() => {
    // Limpieza real: Address y PaymentMethod sí tienen DELETE, se usan para no dejar
    // datos de prueba acumulándose en el usuario semilla. Order NO tiene DELETE por diseño
    // (ver docs/contracts/orders.md) -- esa es una limitación real y documentada, no un
    // olvido: las órdenes creadas por estas pruebas quedan en el historial del usuario de
    // prueba hasta un reset manual del seed (`SEED_ALLOW_RESET=true npm run seed`).
    cy.then(() => {
      const apiUrl = Cypress.env("apiUrl");
      cy.window().then((win) => {
        const token = win.localStorage.getItem("authToken");
        createdAddressIds.splice(0).forEach((id) => {
          cy.request({
            method: "DELETE",
            url: `${apiUrl}/addresses/${id}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
          });
        });
        createdPaymentIds.splice(0).forEach((id) => {
          cy.request({
            method: "DELETE",
            url: `${apiUrl}/payment-methods/${id}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false,
          });
        });
      });
    });
  });

  describe("Fase 1 — Carrito y productos (/cart)", () => {
    it("muestra el producto agregado con nombre, precio, cantidad y subtotal; permite modificar cantidad y eliminar", () => {
      cy.addProductToCart({ quantity: 2 });
      cy.visit("/cart");

      cy.get(".cart-item").should("have.length", 1);
      cy.get(".cart-item-info h3").should("be.visible").and("not.be.empty");
      cy.get(".cart-item-price").should("contain", "$");
      // El testid evita la ambigüedad real con los <span class="icon"> de los botones +/-
      // dentro del mismo contenedor .cart-item-quantity.
      cy.get('[data-testid^="cart-item-quantity-"]').should("contain", "2");
      cy.get(".cart-item-total").should("contain", "$");

      cy.findByLabelText(/aumentar cantidad/i).click();
      cy.get('[data-testid^="cart-item-quantity-"]').should("contain", "3");

      cy.findByLabelText(/disminuir cantidad/i).click();
      cy.get('[data-testid^="cart-item-quantity-"]').should("contain", "2");

      cy.findByRole("button", { name: /eliminar artículo/i }).click();
      cy.findByText("Tu carrito está vacío").should("be.visible");
    });

    it("con carrito vacío no ofrece continuar a checkout, y /checkout redirige a /cart", () => {
      cy.visit("/cart");
      cy.findByText("Tu carrito está vacío").should("be.visible");
      cy.findByRole("button", { name: /proceder al pago/i }).should("not.exist");

      cy.visit("/checkout");
      cy.location("pathname").should("eq", "/cart");
    });

    // No existe una validación de inventario/stock en el flujo de carrito de esta app
    // (ProductDetails.jsx no bloquea "Agregar al carrito" por existencias insuficientes
    // más allá de ocultar el botón cuando stock=0) -- no se inventa un caso que no existe.

    it("con carrito lleno, 'Proceder al pago' navega a /checkout", () => {
      cy.addProductToCart();
      cy.visit("/cart");
      cy.findByRole("button", { name: /proceder al pago/i }).click();
      cy.location("pathname").should("eq", "/checkout");
    });
  });

  describe("Fases 2 a 4 — Checkout (/checkout)", () => {
    beforeEach(() => {
      cy.addProductToCart({ quantity: 2 });
      cy.visit("/checkout");
    });

    it("Fase 2: agrega una dirección real con validación de campos obligatorios y persiste al continuar", () => {
      const address = buildAddress();
      cy.intercept("POST", "**/api/addresses").as("createAddress");

      ensureSectionExpanded("1. Dirección de envío");
      cy.findByRole("button", { name: /agregar nueva dirección/i }).click();

      // Campos obligatorios: enviar vacío no debe pasar la validación HTML5 nativa.
      cy.findByRole("button", { name: /agregar dirección/i }).click();
      cy.get("@createAddress.all").should("have.length", 0);

      cy.findByLabelText(/^dirección/i).type(address.address);
      cy.findByLabelText(/ciudad/i).type(address.city);
      cy.findByLabelText(/estado/i).type(address.state);
      cy.findByLabelText(/código postal/i).type(address.postalCode);
      cy.findByLabelText(/país/i).type(address.country);
      cy.findByLabelText(/teléfono/i).type(address.phone);
      cy.findByRole("button", { name: /agregar dirección/i }).click();

      cy.wait("@createAddress").then(({ response }) => {
        expect(response.statusCode).to.eq(201);
        createdAddressIds.push(response.body._id);
      });

      // La sección se colapsa y muestra la dirección seleccionada -- persiste sin volver a pedirla.
      cy.contains(".selected-address", address.address).should("be.visible");
    });

    it("Fase 3: agrega un método de pago real (sin CVV) y el total se recalcula con el subtotal real", () => {
      const card = buildCard();
      cy.intercept("POST", "**/api/payment-methods").as("createPayment");

      // El número completo de tarjeta nunca sale del formulario (S-03) -- no hay campo CVV.
      cy.findByLabelText(/cvv/i).should("not.exist");

      ensureSectionExpanded("2. Método de pago");
      cy.findByRole("button", { name: /agregar nueva tarjeta/i }).click();
      cy.findByLabelText(/número de tarjeta/i).type(card.cardNumber);
      cy.findByLabelText(/nombre del titular/i).type(card.cardHolderName);
      cy.findByLabelText(/fecha de expiración/i).type(card.expiryDate);
      cy.findByRole("button", { name: /agregar método de pago/i }).click();

      cy.wait("@createPayment").then(({ request, response }) => {
        expect(response.statusCode).to.eq(201);
        // Confirma la regla S-03 a nivel de red real: el payload nunca incluye el número completo.
        expect(request.body).to.not.have.property("cardNumber");
        expect(request.body).to.not.have.property("cvv");
        createdPaymentIds.push(response.body._id);
      });

      cy.contains(".selected-payment", `**** **** **** ${card.cardNumber.slice(-4)}`).should(
        "be.visible",
      );
      // No hay selector de método de envío -- el costo ya viene calculado en el resumen.
      cy.findByText(/envío/i).should("be.visible");
      cy.findByRole("heading", { name: /resumen de la orden/i }).should("be.visible");
    });

    it("Fase 4: revisión, confirmación y creación real de la orden, sin duplicados", () => {
      const address = buildAddress();
      const card = buildCard();

      cy.intercept("POST", "**/api/addresses").as("createAddress");
      ensureSectionExpanded("1. Dirección de envío");
      cy.findByRole("button", { name: /agregar nueva dirección/i }).click();
      cy.findByLabelText(/^dirección/i).type(address.address);
      cy.findByLabelText(/ciudad/i).type(address.city);
      cy.findByLabelText(/estado/i).type(address.state);
      cy.findByLabelText(/código postal/i).type(address.postalCode);
      cy.findByLabelText(/país/i).type(address.country);
      cy.findByLabelText(/teléfono/i).type(address.phone);
      cy.findByRole("button", { name: /agregar dirección/i }).click();
      cy.wait("@createAddress").then(({ response }) => createdAddressIds.push(response.body._id));

      cy.intercept("POST", "**/api/payment-methods").as("createPayment");
      ensureSectionExpanded("2. Método de pago");
      cy.findByRole("button", { name: /agregar nueva tarjeta/i }).click();
      cy.findByLabelText(/número de tarjeta/i).type(card.cardNumber);
      cy.findByLabelText(/nombre del titular/i).type(card.cardHolderName);
      cy.findByLabelText(/fecha de expiración/i).type(card.expiryDate);
      cy.findByRole("button", { name: /agregar método de pago/i }).click();
      cy.wait("@createPayment").then(({ response }) => createdPaymentIds.push(response.body._id));

      // Fase 4: revisión -- el resumen muestra productos, subtotal, IVA, envío y total reales.
      cy.findByRole("heading", { name: /resumen de la orden/i }).should("be.visible");
      cy.findByText(/subtotal:/i).should("be.visible");
      cy.findByText(/iva \(16%\):/i).should("be.visible");
      cy.findByText(/envío:/i).should("be.visible");
      cy.findByText(/total:/i).should("be.visible");
      cy.contains(".selected-address", address.address).should("be.visible");
      cy.contains(".selected-payment", card.cardHolderName).should("be.visible");

      cy.intercept("POST", "**/api/orders").as("createOrder");
      const payButton = () => cy.findByRole("button", { name: /confirmar y pagar/i });

      payButton().should("be.enabled");
      payButton().click();
      // Prevención de doble clic real, a nivel de navegador: el botón se deshabilita
      // de inmediato (ver B-15 en docs/backlog.md) -- un segundo click no debe hacer nada.
      cy.findByRole("button", { name: /procesando/i }).should("be.disabled").click({ force: true });

      cy.wait("@createOrder").then(({ request, response }) => {
        expect(response.statusCode).to.eq(201);
        // El payload real es solo addressId/paymentMethodId -- el backend arma
        // productos/totales desde el carrito del usuario, nunca del cliente.
        expect(Object.keys(request.body).sort()).to.deep.equal(
          ["addressId", "paymentMethodId"].sort(),
        );

        cy.location("pathname").should("eq", "/order-confirmation");
        cy.findByText("¡Gracias por tu compra!").should("be.visible");
        cy.findByText(new RegExp(response.body._id)).should("be.visible");
      });

      // Se creó una sola orden -- no dos, pese al segundo click.
      cy.get("@createOrder.all").should("have.length", 1);

      // El carrito quedó vacío tras la orden.
      cy.window().then((win) => {
        expect(JSON.parse(win.localStorage.getItem("cart") || "[]")).to.have.length(0);
      });

      // Nota real (verificado en vivo, no asumido): recargar /order-confirmation con F5 NO
      // pierde location.state -- el History API del navegador conserva el state de la misma
      // entrada de historial a través de un reload real. La entrada sigue mostrando la misma
      // orden, sin volver a llamar a la API (OrderConfirmation.jsx es de solo lectura, nunca
      // hace POST). El caso real que sí puede perder el state -- y el que corrige B-13 -- es
      // entrar a /order-confirmation por primera vez sin haber pasado por el checkout real
      // (URL escrita a mano, un link viejo/compartido, o un bookmark): eso sí crea una entrada
      // de historial nueva sin state.
      // Navega a otra ruta primero para forzar una carga fresca real (visitar la misma URL en
      // la que ya se está puede no disparar una navegación real en algunos motores).
      cy.visit("/cart");
      cy.visit("/order-confirmation");
      cy.location("pathname").should("eq", "/");
      cy.findByText("¡Gracias por tu compra!").should("not.exist");
    });
  });
});
