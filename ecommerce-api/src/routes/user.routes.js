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

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Perfil del usuario logueado (sin password)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuario
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: Sin token o token inválido }
 *       404: { description: Usuario no encontrado }
 *   put:
 *     tags: [Users]
 *     summary: Actualiza nombre y/o email del usuario logueado
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: Sin token o token inválido }
 *       422:
 *         description: 'El email ya pertenece a otro usuario ("User already exist")'
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 */
router.get("/me", getMe);
router.put("/me", updateMeValidation, validate, updateMe);

/**
 * @openapi
 * /users/me/password:
 *   put:
 *     tags: [Users]
 *     summary: Cambia la contraseña del usuario logueado
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 6 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { message: { type: string, example: Contraseña actualizada } }
 *       401:
 *         description: currentPassword incorrecta, o sin token/token inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorMessage' }
 *       422:
 *         description: Validación fallida (ej. newPassword menor a 6 caracteres)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationError' }
 */
router.put("/me/password", changePasswordValidation, validate, changePassword);

export default router;
