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

router.get("/search", searchProducts);
router.get("/", getAllProducts);
router.get("/:id", productIdValidation, validate, getProductById);
router.post("/", requireAuth, requireAdmin, createProductValidation, validate, createProduct);
router.put("/:id", requireAuth, requireAdmin, updateProductValidation, validate, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, productIdValidation, validate, deleteProduct);

export default router;
