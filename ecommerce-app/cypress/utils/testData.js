// Generadores de datos de prueba para specs de Cypress. El registro NUNCA debe usar una
// cuenta fija -- el backend rechaza (422 "User already exist") un email duplicado, así que
// reusar un correo entre corridas rompería la prueba a partir de la segunda ejecución.

/**
 * Genera un usuario único por corrida, listo para el flujo de registro.
 * `password` cumple la regla real del backend (mínimo 6 caracteres, ver
 * validators.md/RegisterForm.jsx: min 6).
 */
export function buildUniqueUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    name: "Usuario Cypress",
    email: `cypress-${timestamp}@example.com`,
    password: "Test1234!",
    ...overrides,
  };
}

/** Dirección real y válida contra las reglas de AddressForm.jsx (todos los campos requeridos). */
export function buildAddress(overrides = {}) {
  return {
    address: "Av. Reforma 123",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06600",
    country: "México",
    phone: "5555555555",
    ...overrides,
  };
}

/**
 * Tarjeta real y válida contra PaymentForm.jsx. El número completo nunca sale del
 * formulario (decisión S-03) -- solo se usa para que el componente derive last4/brand.
 */
export function buildCard(overrides = {}) {
  return {
    cardNumber: "4111111111111111",
    cardHolderName: "Ana Test",
    expiryDate: "12/28",
    ...overrides,
  };
}
