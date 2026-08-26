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

router.get("/", getAllCategories);
router.get("/:id", categoryIdValidation, validate, getCategoryById);
router.get(
  "/:id/products",
  categoryIdValidation,
  validate,
  getProductsByCategoryAndChildren,
);
router.post("/", requireAuth, requireAdmin, createCategoryValidation, validate, createCategory);
router.put("/:id", requireAuth, requireAdmin, updateCategoryValidation, validate, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, categoryIdValidation, validate, deleteCategory);

export default router;
