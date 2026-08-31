import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.use(requireAuth);

const itemIdValidation = [
  param("itemId").isMongoId().withMessage("El id del item debe ser un ObjectId válido"),
];

const addItemValidation = [
  body("productId")
    .notEmpty()
    .withMessage("El producto es requerido")
    .isMongoId()
    .withMessage("El producto debe ser un ObjectId válido"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser un entero mayor o igual a 1"),
];

const updateQuantityValidation = [
  param("itemId").isMongoId().withMessage("El id del item debe ser un ObjectId válido"),
  body("quantity")
    .notEmpty()
    .withMessage("La cantidad es requerida")
    .isInt({ min: 1 })
    .withMessage("La cantidad debe ser un entero mayor o igual a 1"),
  body("clientTimestamp")
    .optional()
    .isInt({ min: 0 })
    .withMessage("clientTimestamp debe ser un entero no negativo"),
];

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Trae (o crea) el carrito del usuario logueado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Sin token o token inválido }
 *   post:
 *     tags: [Cart]
 *     summary: Agrega un producto (suma cantidad si ya existe en el carrito)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer, minimum: 1, default: 1 }
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *   delete:
 *     tags: [Cart]
 *     summary: Vacía el carrito completo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Carrito vacío
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Sin token o token inválido }
 */
router.get("/", getCart);
router.post("/", addItemValidation, validate, addItem);
router.delete("/", clearCart);

/**
 * @openapi
 * /cart/{itemId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Cambia la cantidad de un ítem del carrito
 *     description: itemId es el _id del subdocumento en Cart.products, no el productId.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1 }
 *               clientTimestamp:
 *                 type: integer
 *                 minimum: 0
 *                 description: >-
 *                   Opcional. Date.now() capturado por el cliente al momento del clic (no de
 *                   la respuesta). Si se manda, el servidor descarta este PATCH cuando ya se
 *                   aplicó uno más reciente para el mismo ítem, para que dos cambios rápidos
 *                   de cantidad no puedan quedar en un orden distinto al que el usuario clickeó.
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 *   delete:
 *     tags: [Cart]
 *     summary: Quita un ítem del carrito
 *     description: itemId es el _id del subdocumento en Cart.products, no el productId.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Cart' }
 *       401: { description: Sin token o token inválido }
 */
router.patch("/:itemId", updateQuantityValidation, validate, updateQuantity);
router.delete("/:itemId", itemIdValidation, validate, removeItem);

export default router;
