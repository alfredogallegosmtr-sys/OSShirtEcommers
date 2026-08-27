const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // ecommerce-app corre en el puerto 3001 (fijo en .env, para no chocar con
    // otros proyectos del curso que usan 3000 -- ver CLAUDE.md).
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3001",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on, config) {
      return config;
    },
    env: {
      // apiClient.js (ecommerce-app/src/services/apiClient.js) usa este mismo default
      // (REACT_APP_API_URL || "http://localhost:4001/api") -- se repite aquí porque
      // Cypress corre fuera del proceso de la app y no lee su .env.
      apiUrl: process.env.CYPRESS_API_URL || "http://localhost:4001/api",
      // Usuario semilla real (ver "Contexto operativo" en docs/backlog.md): user4@test.com
      // es un customer normal, no admin, para no chocar con las rutas que sí distinguen rol.
      // Sobreescribir vía variables de entorno o un cypress.env.json local (gitignorado)
      // para correr contra cualquier otro ambiente/usuario -- nunca hardcodear credenciales
      // reales de un ambiente que no sea este seed de desarrollo.
      testUserEmail: process.env.CYPRESS_TEST_USER_EMAIL || "user4@test.com",
      testUserPassword: process.env.CYPRESS_TEST_USER_PASSWORD || "123456",
    },
  },
});
