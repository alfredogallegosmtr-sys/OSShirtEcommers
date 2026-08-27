import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import { getOrders, createOrder } from "../controllers/order.controller.js";

const router = Router();

router.use(requireAuth);

const createOrderValidation = [
  body("addressId")
    .notEmpty()
    .withMessage("La dirección es requerida")
    .isMongoId()
    .withMessage("addressId debe ser un ObjectId válido"),
  body("paymentMethodId")
    .notEmpty()
    .withMessage("El método de pago es requerido")
    .isMongoId()
    .withMessage("paymentMethodId debe ser un ObjectId válido"),
];

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lista las órdenes del usuario logueado
 *     description: products.productId, address y paymentMethod vienen poblados.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Órdenes del usuario, más reciente primero
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Order' } }
 *       401: { description: Sin token o token inválido }
 *   post:
 *     tags: [Orders]
 *     summary: Crea una orden a partir del carrito real del usuario
 *     description: >
 *       El backend arma products/subtotalPrice/shippingCost/totalPrice a partir del Cart real
 *       del usuario — nunca confía en nada que mande el cliente más allá de addressId y
 *       paymentMethodId. Vacía el carrito al crear la orden. Sin PUT/DELETE en este alcance.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId, paymentMethodId]
 *             properties:
 *               addressId: { type: string, description: Debe pertenecer al usuario logueado }
 *               paymentMethodId: { type: string, description: Debe pertenecer al usuario logueado }
 *     responses:
 *       201:
 *         description: Orden creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       401: { description: Sin token o token inválido }
 *       404:
 *         description: Dirección o método de pago no encontrado (o no es del usuario)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 *       422:
 *         description: addressId/paymentMethodId inválidos, o el carrito está vacío
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 */
router.get("/", getOrders);
router.post("/", createOrderValidation, validate, createOrder);

export default router;
