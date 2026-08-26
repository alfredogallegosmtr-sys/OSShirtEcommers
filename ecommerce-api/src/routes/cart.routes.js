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
];

router.get("/", getCart);
router.post("/", addItemValidation, validate, addItem);
router.patch("/:itemId", updateQuantityValidation, validate, updateQuantity);
router.delete("/:itemId", itemIdValidation, validate, removeItem);
router.delete("/", clearCart);

export default router;
