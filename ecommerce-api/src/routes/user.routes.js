import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validation.js";
import { getMe, updateMe, changePassword } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth);

const updateMeValidation = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
  body("email").optional().isEmail().withMessage("El email debe ser válido"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("La contraseña actual es requerida"),
  body("newPassword")
    .notEmpty()
    .withMessage("La nueva contraseña es requerida")
    .isLength({ min: 6 })
    .withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
];

router.get("/me", getMe);
router.put("/me", updateMeValidation, validate, updateMe);
router.put("/me/password", changePasswordValidation, validate, changePassword);

export default router;
