import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";

const router = Router();

router.use(requireAuth);

const addToWishlistValidation = [
  body("productId")
    .notEmpty()
    .withMessage("El producto es requerido")
    .isMongoId()
    .withMessage("El producto debe ser un ObjectId válido"),
];

const productIdParamValidation = [
  param("productId").isMongoId().withMessage("El id del producto debe ser un ObjectId válido"),
];

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Wishlist del usuario logueado (se crea vacía si no existía)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Wishlist con products poblado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishList' }
 *       401: { description: Sin token o token inválido }
 *   post:
 *     tags: [Wishlist]
 *     summary: Agrega un producto (idempotente, no duplica si ya está)
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
 *     responses:
 *       201:
 *         description: Wishlist actualizada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishList' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: productId inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 */
router.get("/", getWishlist);
router.post("/", addToWishlistValidation, validate, addToWishlist);

/**
 * @openapi
 * /wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Quita un producto de la wishlist (idempotente si no estaba)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: productId, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Wishlist actualizada (responde 200, no 204)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WishList' }
 *       401: { description: Sin token o token inválido }
 *       422: { description: productId no es un ObjectId válido }
 */
router.delete("/:productId", productIdParamValidation, validate, removeFromWishlist);

export default router;
