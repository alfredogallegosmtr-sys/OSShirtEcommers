import { setupServer } from "msw/node";

// Sin handlers por defecto: cada archivo de test registra los suyos con
// `server.use(...)` (y `server.resetHandlers()` los limpia entre tests, ver
// setupTests.js). Así cada test declara únicamente el endpoint que le
// interesa, sin handlers globales compartidos que puedan enmascarar bugs.
export const server = setupServer();
