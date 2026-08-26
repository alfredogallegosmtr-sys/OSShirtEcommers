# Validadores (express-validator)

Definidos como arrays de `body(...)`/`param(...)` al inicio de cada archivo de ruta, aplicados
antes del middleware `validate` (`middlewares/validation.js`): si `validationResult(req)` tiene
errores, responde `422 { errors: [...] }` (formato nativo de express-validator, no un mensaje
custom); si no, `next()`.

- `product.routes.js` (`POST`/`PUT`/`DELETE` pasan primero por `requireAuth` + `requireAdmin` —
  401 sin token, 403 si el rol no es `admin`, antes de llegar a estos validadores):
  - `productIdValidation` — `param("id").isMongoId()`.
  - `createProductValidation` — `name` requerido; `price` requerido + `isFloat({min:0})`;
    `category` opcional + `isMongoId()`.
  - `updateProductValidation` — `param("id").isMongoId()`; `name`/`price`/`stock`/`category`
    todos opcionales (con sus mismas reglas que en create).
- `category.routes.js` (mismo esquema: `POST`/`PUT`/`DELETE` pasan primero por `requireAuth` +
  `requireAdmin`):
  - `categoryIdValidation` — `param("id").isMongoId()`.
  - `createCategoryValidation` — `name` y `description` requeridos; `parentCategory` opcional +
    `isMongoId()`.
  - `updateCategoryValidation` — `param("id").isMongoId()`; `name`/`description`/`parentCategory`
    opcionales.
- `cart.routes.js` (todas después de `requireAuth`, que corre primero — sin token da 401 antes de
  llegar a la validación):
  - `itemIdValidation` — `param("itemId").isMongoId()`.
  - `addItemValidation` — `productId` requerido + `isMongoId()`; `quantity` opcional +
    `isInt({min:1})`.
  - `updateQuantityValidation` — `param("itemId").isMongoId()`; `quantity` requerido +
    `isInt({min:1})`.
- `address.routes.js` (todo el router pasa por `requireAuth`, igual que `cart.routes.js`):
  - `addressIdValidation` — `param("id").isMongoId()`.
  - `createAddressValidation` — `address`/`city`/`state`/`postalCode`/`country`/`phone`
    requeridos; `addressType` opcional + `isIn(["home","work","other"])`; `isDefault` opcional +
    `isBoolean()`.
  - `updateAddressValidation` — `param("id").isMongoId()`; todos los campos de create, opcionales.
- `paymentMethod.routes.js` (todo el router pasa por `requireAuth`):
  - `paymentMethodIdValidation` — `param("id").isMongoId()`.
  - `rejectRawCardFields` (compartido entre create/update) — `body("cardNumber").not().exists()`,
    `body("cvv").not().exists()`. Decisión S-03: se rechazan explícitamente, no se ignoran en
    silencio.
  - `createPaymentMethodValidation` — `type` requerido + `isIn([...5 valores])`; `last4` opcional
    + `isLength({min:4,max:4})` + `isNumeric()`; `brand`/`cardHolderName` opcionales; `paypalEmail`
    opcional + `isEmail()`; `isDefault`/`isActive` opcionales + `isBoolean()`.
  - `updatePaymentMethodValidation` — `param("id").isMongoId()`; mismos campos que create, todos
    opcionales.
- `auth.routes.js`: **sin validadores de express-validator.** `register`/`login` siguen con
  chequeo manual inline dentro del controller (campos requeridos, email duplicado) — así está
  también en el proyecto de referencia, no es una omisión.

## Middleware de rol admin

`requireAdmin` (`src/middlewares/auth.middleware.js`) exige `req.user.role === "admin"` (403 si
no); debe montarse siempre después de `requireAuth`, del cual depende `req.user`. Solo protege
hoy la escritura de `products`/`categories` — ninguna otra ruta lo usa.
