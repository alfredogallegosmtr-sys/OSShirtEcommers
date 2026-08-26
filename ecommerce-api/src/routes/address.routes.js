import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = Router();

router.use(requireAuth);

const addressIdValidation = [
  param("id").isMongoId().withMessage("El id de la dirección debe ser un ObjectId válido"),
];

const createAddressValidation = [
  body("address").notEmpty().withMessage("La dirección es requerida"),
  body("city").notEmpty().withMessage("La ciudad es requerida"),
  body("state").notEmpty().withMessage("El estado es requerido"),
  body("postalCode").notEmpty().withMessage("El código postal es requerido"),
  body("country").notEmpty().withMessage("El país es requerido"),
  body("phone").notEmpty().withMessage("El teléfono es requerido"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("El tipo de dirección debe ser home, work u other"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
];

const updateAddressValidation = [
  param("id").isMongoId().withMessage("El id de la dirección debe ser un ObjectId válido"),
  body("address").optional().notEmpty().withMessage("La dirección no puede estar vacía"),
  body("city").optional().notEmpty().withMessage("La ciudad no puede estar vacía"),
  body("state").optional().notEmpty().withMessage("El estado no puede estar vacío"),
  body("postalCode").optional().notEmpty().withMessage("El código postal no puede estar vacío"),
  body("country").optional().notEmpty().withMessage("El país no puede estar vacío"),
  body("phone").optional().notEmpty().withMessage("El teléfono no puede estar vacío"),
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("El tipo de dirección debe ser home, work u other"),
  body("isDefault").optional().isBoolean().withMessage("isDefault debe ser booleano"),
];

router.get("/", getAddresses);
router.post("/", createAddressValidation, validate, createAddress);
router.put("/:id", updateAddressValidation, validate, updateAddress);
router.delete("/:id", addressIdValidation, validate, deleteAddress);

export default router;
