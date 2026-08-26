import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.get("/:id/products", getProductsByCategoryAndChildren);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
