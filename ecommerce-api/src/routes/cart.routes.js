import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/", addItem);
router.patch("/:itemId", updateQuantity);
router.delete("/:itemId", removeItem);
router.delete("/", clearCart);

export default router;
