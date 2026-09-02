import { Router } from "express";
import { body } from "express-validator";
import { createClientLog } from "../controllers/log.controller.js";
import validate from "../middlewares/validation.js";
import { clientLogRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Público (sin requireAuth): los errores del frontend pasan también sin sesión (ej. un
// fallo de red en la página de login misma). Límites de longitud por campo, no solo el
// cap global de express.json() (100kb) -- evita que un solo evento gigante llene el log.
const createClientLogValidation = [
  body("event").notEmpty().withMessage("event es requerido").isLength({ max: 100 }),
  body("message").optional().isLength({ max: 2000 }),
  body("kind").optional().isLength({ max: 50 }),
  body("status").optional().isInt(),
  body("path").optional().isLength({ max: 500 }),
  body("stack").optional().isLength({ max: 4000 }),
  body("componentStack").optional().isLength({ max: 4000 }),
];

/**
 * @openapi
 * /logs/client:
 *   post:
 *     tags: [Logs]
 *     summary: Reporta un evento de error del frontend (fetch clasificado o error de render atrapado por ErrorBoundary)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event]
 *             properties:
 *               event: { type: string, example: api_error }
 *               message: { type: string }
 *               kind: { type: string, example: SERVER_ERROR }
 *               status: { type: integer }
 *               path: { type: string }
 *               stack: { type: string }
 *               componentStack: { type: string }
 *     responses:
 *       204:
 *         description: Evento registrado
 *       422:
 *         description: Falta "event" o algún campo excede el largo permitido
 *       429:
 *         description: Demasiados eventos, intenta de nuevo más tarde
 */
router.post("/client", clientLogRateLimit, createClientLogValidation, validate, createClientLog);

export default router;
