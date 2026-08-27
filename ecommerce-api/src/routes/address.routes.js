import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = Router();

router.use(requireAuth);

const addressIdValidation = [
  param("id").isMongoId().withMessage("El id de la dirección debe ser un ObjectId válido"),
];

const createAddressValidation = [
  body("address").notEmpty().withMessage("La dirección es requerida"),
  body("city").notEmpty().withMessage("La ciudad es requerida"),
  body("state").notEmpty().withMessage("El estado es requerido"),
  body("postalCode").notEmpty().withMessage("El código postal es requerido"),
  body("country").notEmpty().withMessage("El país es requerido"),
  body("phone").notEmpty().withMessage("El teléfono es requerido"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("El tipo de dirección debe ser home, work u other"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
];

const updateAddressValidation = [
  param("id").isMongoId().withMessage("El id de la dirección debe ser un ObjectId válido"),
  body("address").optional().notEmpty().withMessage("La dirección no puede estar vacía"),
  body("city").optional().notEmpty().withMessage("La ciudad no puede estar vacía"),
  body("state").optional().notEmpty().withMessage("El estado no puede estar vacío"),
  body("postalCode").optional().notEmpty().withMessage("El código postal no puede estar vacío"),
  body("country").optional().notEmpty().withMessage("El país no puede estar vacío"),
  body("phone").optional().notEmpty().withMessage("El teléfono no puede estar vacío"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("El tipo de dirección debe ser home, work u other"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
];

/**
 * @openapi
 * /addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: Lista las direcciones del usuario logueado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Direcciones del usuario, más reciente primero
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Address' } }
 *       401: { description: Sin token o token inválido }
 *   post:
 *     tags: [Addresses]
 *     summary: Crea una dirección
 *     description: isDefault=true desmarca las demás direcciones de este usuario.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address, city, state, postalCode, country, phone]
 *             properties:
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string }
 *               country: { type: string }
 *               phone: { type: string }
 *               addressType: { type: string, enum: [home, work, other] }
 *               isDefault: { type: boolean }
 *     responses:
 *       201:
 *         description: Dirección creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Address' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.get("/", getAddresses);
router.post("/", createAddressValidation, validate, createAddress);

/**
 * @openapi
 * /addresses/{id}:
 *   put:
 *     tags: [Addresses]
 *     summary: Actualiza una dirección propia
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               postalCode: { type: string }
 *               country: { type: string }
 *               phone: { type: string }
 *               addressType: { type: string, enum: [home, work, other] }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Dirección actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Address' }
 *       401: { description: Sin token o token inválido }
 *       404:
 *         description: No existe o no pertenece al usuario logueado (no revela cuál)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 *   delete:
 *     tags: [Addresses]
 *     summary: Elimina una dirección propia (hard delete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Eliminada (sin contenido) }
 *       401: { description: Sin token o token inválido }
 *       404:
 *         description: No existe o no pertenece al usuario logueado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 */
router.put("/:id", updateAddressValidation, validate, updateAddress);
router.delete("/:id", addressIdValidation, validate, deleteAddress);

export default router;
