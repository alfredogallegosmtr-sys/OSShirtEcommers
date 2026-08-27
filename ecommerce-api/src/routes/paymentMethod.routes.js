import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethod.controller.js";

const router = Router();

router.use(requireAuth);

const paymentMethodIdValidation = [
  param("id").isMongoId().withMessage("El id del método de pago debe ser un ObjectId válido"),
];

// Decisión S-03 (docs/backlog.md): el número completo de tarjeta y el cvv nunca se aceptan,
// ni siquiera para descartarlos después — se rechazan explícitamente en el request.
const rejectRawCardFields = [
  body("cardNumber")
    .not()
    .exists()
    .withMessage("No se acepta el número completo de tarjeta; enviar solo 'last4'"),
  body("cvv")
    .not()
    .exists()
    .withMessage("El cvv nunca se solicita ni se almacena"),
];

const createPaymentMethodValidation = [
  ...rejectRawCardFields,
  body("type")
    .notEmpty()
    .withMessage("El tipo es requerido")
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Tipo de método de pago inválido"),
  body("last4")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("last4 debe tener exactamente 4 dígitos")
    .isNumeric()
    .withMessage("last4 debe ser numérico"),
  body("brand").optional().isString().withMessage("brand debe ser texto"),
  body("cardHolderName")
    .optional()
    .notEmpty()
    .withMessage("cardHolderName no puede estar vacío"),
  body("paypalEmail")
    .optional()
    .isEmail()
    .withMessage("paypalEmail debe ser un email válido"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
  body("isActive").optional().isBoolean().withMessage("isActive debe ser booleano"),
];

const updatePaymentMethodValidation = [
  param("id").isMongoId().withMessage("El id del método de pago debe ser un ObjectId válido"),
  ...rejectRawCardFields,
  body("type")
    .optional()
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Tipo de método de pago inválido"),
  body("last4")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("last4 debe tener exactamente 4 dígitos")
    .isNumeric()
    .withMessage("last4 debe ser numérico"),
  body("brand").optional().isString().withMessage("brand debe ser texto"),
  body("cardHolderName")
    .optional()
    .notEmpty()
    .withMessage("cardHolderName no puede estar vacío"),
  body("paypalEmail")
    .optional()
    .isEmail()
    .withMessage("paypalEmail debe ser un email válido"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
  body("isActive").optional().isBoolean().withMessage("isActive debe ser booleano"),
];

/**
 * @openapi
 * /payment-methods:
 *   get:
 *     tags: [PaymentMethods]
 *     summary: Lista los métodos de pago del usuario logueado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Métodos de pago del usuario, más reciente primero
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/PaymentMethod' } }
 *       401: { description: Sin token o token inválido }
 *   post:
 *     tags: [PaymentMethods]
 *     summary: Crea un método de pago
 *     description: >
 *       Rechaza explícitamente cardNumber/cvv (422) — nunca se aceptan ni se descartan en
 *       silencio (decisión S-03). isDefault=true desmarca los demás métodos del usuario.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery]
 *               last4: { type: string, minLength: 4, maxLength: 4 }
 *               brand: { type: string }
 *               cardHolderName: { type: string }
 *               paypalEmail: { type: string, format: email }
 *               isDefault: { type: boolean }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Método de pago creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentMethod' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: Validación fallida (incluye enviar cardNumber o cvv)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.get("/", getPaymentMethods);
router.post("/", createPaymentMethodValidation, validate, createPaymentMethod);

/**
 * @openapi
 * /payment-methods/{id}:
 *   put:
 *     tags: [PaymentMethods]
 *     summary: Actualiza un método de pago propio
 *     description: Mismo rechazo de cardNumber/cvv que en la creación.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery]
 *               last4: { type: string, minLength: 4, maxLength: 4 }
 *               brand: { type: string }
 *               cardHolderName: { type: string }
 *               paypalEmail: { type: string, format: email }
 *               isDefault: { type: boolean }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Método de pago actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentMethod' }
 *       401: { description: Sin token o token inválido }
 *       404:
 *         description: No existe o no pertenece al usuario logueado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 *   delete:
 *     tags: [PaymentMethods]
 *     summary: Elimina un método de pago propio (hard delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Eliminado (sin contenido) }
 *       401: { description: Sin token o token inválido }
 *       404:
 *         description: No existe o no pertenece al usuario logueado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 */
router.put("/:id", updatePaymentMethodValidation, validate, updatePaymentMethod);
router.delete("/:id", paymentMethodIdValidation, validate, deletePaymentMethod);

export default router;
