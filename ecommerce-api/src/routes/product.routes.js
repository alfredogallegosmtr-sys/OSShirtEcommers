import { Router } from "express";
import { body, param } from "express-validator";
import {
  getAllProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import validate from "../middlewares/validation.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

const productIdValidation = [
  param("id").isMongoId().withMessage("El id del producto debe ser un ObjectId válido"),
];

const createProductValidation = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("price")
    .notEmpty()
    .withMessage("El precio es requerido")
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número positivo"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("La categoría debe ser un ObjectId válido"),
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("El id del producto debe ser un ObjectId válido"),
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio debe ser un número positivo"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un entero no negativo"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("La categoría debe ser un ObjectId válido"),
];

/**
 * @openapi
 * /products/search:
 *   get:
 *     tags: [Products]
 *     summary: Búsqueda/filtro de productos
 *     security: []
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string }, description: ObjectId de Category }
 *       - { in: query, name: minPrice, schema: { type: number } }
 *       - { in: query, name: maxPrice, schema: { type: number } }
 *       - { in: query, name: inStock, schema: { type: boolean } }
 *       - { in: query, name: sort, schema: { type: string } }
 *       - { in: query, name: order, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Lista de productos que matchean los filtros
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/search", searchProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Lista todos los productos activos (sin paginar), con category poblada
 *     security: []
 *     responses:
 *       200:
 *         description: Lista completa de productos
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Product' } }
 *   post:
 *     tags: [Products]
 *     summary: Crea un producto (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string }
 *               price: { type: number, minimum: 0 }
 *               category: { type: string, description: ObjectId de Category (opcional) }
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 *       422:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.get("/", getAllProducts);
router.post("/", requireAuth, requireAdmin, createProductValidation, validate, createProduct);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Detalle de un producto
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404: { description: No existe o está soft-deleted (is_deleted) }
 *       422: { description: El id no es un ObjectId válido }
 *   put:
 *     tags: [Products]
 *     summary: Actualiza un producto (solo admin)
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
 *               price: { type: number, minimum: 0 }
 *               stock: { type: integer, minimum: 0 }
 *               category: { type: string }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 *       404: { description: No existe }
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete (is_deleted = true), solo admin
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Eliminado (sin contenido) }
 *       401: { description: Sin token }
 *       403: { description: 'Token válido pero rol distinto de admin' }
 *       404: { description: No existe }
 */
router.get("/:id", productIdValidation, validate, getProductById);
router.put("/:id", requireAuth, requireAdmin, updateProductValidation, validate, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, productIdValidation, validate, deleteProduct);

export default router;
