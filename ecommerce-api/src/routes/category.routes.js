import { Router } from "express";
import { body, param } from "express-validator";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "../controllers/category.controller.js";
import validate from "../middlewares/validation.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

const categoryIdValidation = [
  param("id").isMongoId().withMessage("El id de la categoría debe ser un ObjectId válido"),
];

const createCategoryValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("description").notEmpty().withMessage("La descripción es requerida"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("La categoría padre debe ser un ObjectId válido"),
];

const updateCategoryValidation = [
  param("id").isMongoId().withMessage("El id de la categoría debe ser un ObjectId válido"),
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("La descripción no puede estar vacía"),
  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("La categoría padre debe ser un ObjectId válido"),
];

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Lista todas las categorías (raíz + subcategorías)
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Category' } }
 *   post:
 *     tags: [Categories]
 *     summary: Crea una categoría (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               parentCategory: { type: string, description: ObjectId de otra Category (opcional) }
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 *       422:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.get("/", getAllCategories);
router.post("/", requireAuth, requireAdmin, createCategoryValidation, validate, createCategory);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Detalle de una categoría
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       422: { description: El id no es un ObjectId válido }
 *   put:
 *     tags: [Categories]
 *     summary: Actualiza una categoría (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               parentCategory: { type: string }
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 *   delete:
 *     tags: [Categories]
 *     summary: Elimina una categoría (hard delete, solo admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Eliminada (sin contenido) }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 */
router.get("/:id", categoryIdValidation, validate, getCategoryById);
router.put("/:id", requireAuth, requireAdmin, updateCategoryValidation, validate, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, categoryIdValidation, validate, deleteCategory);

/**
 * @openapi
 * /categories/{id}/products:
 *   get:
 *     tags: [Categories]
 *     summary: Productos de una categoría y sus subcategorías (recursión de un nivel)
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Productos de la categoría y sus hijas
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Product' } }
 *       422: { description: El id no es un ObjectId válido }
 */
router.get(
  "/:id/products",
  categoryIdValidation,
  validate,
  getProductsByCategoryAndChildren,
);

export default router;
