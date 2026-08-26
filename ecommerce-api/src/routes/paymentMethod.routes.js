import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethod.controller.js";

const router = Router();

router.use(requireAuth);

const paymentMethodIdValidation = [
  param("id").isMongoId().withMessage("El id del método de pago debe ser un ObjectId válido"),
];

// Decisión S-03 (docs/backlog.md): el número completo de tarjeta y el cvv nunca se aceptan,
// ni siquiera para descartarlos después — se rechazan explícitamente en el request.
const rejectRawCardFields = [
  body("cardNumber")
    .not()
    .exists()
    .withMessage("No se acepta el número completo de tarjeta; enviar solo 'last4'"),
  body("cvv")
    .not()
    .exists()
    .withMessage("El cvv nunca se solicita ni se almacena"),
];

const createPaymentMethodValidation = [
  ...rejectRawCardFields,
  body("type")
    .notEmpty()
    .withMessage("El tipo es requerido")
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Tipo de método de pago inválido"),
  body("last4")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("last4 debe tener exactamente 4 dígitos")
    .isNumeric()
    .withMessage("last4 debe ser numérico"),
  body("brand").optional().isString().withMessage("brand debe ser texto"),
  body("cardHolderName")
    .optional()
    .notEmpty()
    .withMessage("cardHolderName no puede estar vacío"),
  body("paypalEmail")
    .optional()
    .isEmail()
    .withMessage("paypalEmail debe ser un email válido"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
  body("isActive").optional().isBoolean().withMessage("isActive debe ser booleano"),
];

const updatePaymentMethodValidation = [
  param("id").isMongoId().withMessage("El id del método de pago debe ser un ObjectId válido"),
  ...rejectRawCardFields,
  body("type")
    .optional()
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Tipo de método de pago inválido"),
  body("last4")
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage("last4 debe tener exactamente 4 dígitos")
    .isNumeric()
    .withMessage("last4 debe ser numérico"),
  body("brand").optional().isString().withMessage("brand debe ser texto"),
  body("cardHolderName")
    .optional()
    .notEmpty()
    .withMessage("cardHolderName no puede estar vacío"),
  body("paypalEmail")
    .optional()
    .isEmail()
    .withMessage("paypalEmail debe ser un email válido"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
  body("isActive").optional().isBoolean().withMessage("isActive debe ser booleano"),
];

router.get("/", getPaymentMethods);
router.post("/", createPaymentMethodValidation, validate, createPaymentMethod);
router.put("/:id", updatePaymentMethodValidation, validate, updatePaymentMethod);
router.delete("/:id", paymentMethodIdValidation, validate, deletePaymentMethod);

export default router;
