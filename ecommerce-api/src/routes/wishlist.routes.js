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

router.get("/", getWishlist);
router.post("/", addToWishlistValidation, validate, addToWishlist);
router.delete("/:productId", productIdParamValidation, validate, removeFromWishlist);

export default router;
