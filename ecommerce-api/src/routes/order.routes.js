import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import { getOrders, createOrder } from "../controllers/order.controller.js";

const router = Router();

router.use(requireAuth);

const createOrderValidation = [
  body("addressId")
    .notEmpty()
    .withMessage("La dirección es requerida")
    .isMongoId()
    .withMessage("addressId debe ser un ObjectId válido"),
  body("paymentMethodId")
    .notEmpty()
    .withMessage("El método de pago es requerido")
    .isMongoId()
    .withMessage("paymentMethodId debe ser un ObjectId válido"),
];

router.get("/", getOrders);
router.post("/", createOrderValidation, validate, createOrder);

export default router;
