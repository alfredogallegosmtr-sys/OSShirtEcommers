// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// react-router-dom v7 (dependencia real del repo) usa TextEncoder/TextDecoder
// en su bundle de Node, que la jsdom de react-scripts (16.7.0) no expone
// como global. Sin este polyfill, cualquier test que importe
// "react-router-dom" falla al cargar el módulo.
import { TextEncoder, TextDecoder } from 'util';
import { server } from './mocks/server';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// MSW intercepta las peticiones reales de axios (vía apiClient) en lugar de
// mockear fetch/axios a mano. Cada archivo de test registra sus propios
// handlers con `server.use(...)`.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
