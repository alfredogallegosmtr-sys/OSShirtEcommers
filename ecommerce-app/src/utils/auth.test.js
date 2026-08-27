import {
  saveToken,
  getToken,
  clearToken,
  decodeToken,
  isTokenExpired,
} from "./auth";

// Helper para construir un JWT válido (header.payload.signature) sin
// necesidad de firmarlo de verdad: decodeToken solo lee el payload.
function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

afterEach(() => {
  localStorage.clear();
});

test("happy: saveToken + getToken devuelve el token guardado", () => {
  saveToken("abc123");
  expect(getToken()).toBe("abc123");
});

test("happy: decodeToken devuelve el payload {userId,name,role,exp}", () => {
  const token = makeToken({ userId: "u1", name: "Rodrigo", role: "admin", exp: 9999999999 });
  expect(decodeToken(token)).toEqual({
    userId: "u1",
    name: "Rodrigo",
    role: "admin",
    exp: 9999999999,
  });
});

test("happy: isTokenExpired con exp futuro -> false", () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  const token = makeToken({ userId: "u1", exp: futureExp });
  expect(isTokenExpired(token)).toBe(false);
});

test("negativo: saveToken(null) no escribe nada, getToken sigue devolviendo null", () => {
  saveToken(null);
  expect(getToken()).toBeNull();
});

test('negativo: saveToken("") no escribe nada, getToken sigue devolviendo null', () => {
  saveToken("");
  expect(getToken()).toBeNull();
});

test("negativo: getToken sin authToken en localStorage devuelve null (no undefined)", () => {
  expect(getToken()).toBeNull();
});

test("negativo: tras clearToken, getToken devuelve null", () => {
  saveToken("abc123");
  clearToken();
  expect(getToken()).toBeNull();
});

test('negativo: decodeToken("no-es-un-jwt") devuelve null y no lanza', () => {
  expect(() => decodeToken("no-es-un-jwt")).not.toThrow();
  expect(decodeToken("no-es-un-jwt")).toBeNull();
});

test("negativo: isTokenExpired sin exp en el payload -> true", () => {
  const token = makeToken({ userId: "u1" });
  expect(isTokenExpired(token)).toBe(true);
});

test("negativo: isTokenExpired con exp en el pasado -> true", () => {
  const pastExp = Math.floor(Date.now() / 1000) - 3600;
  const token = makeToken({ userId: "u1", exp: pastExp });
  expect(isTokenExpired(token)).toBe(true);
});
