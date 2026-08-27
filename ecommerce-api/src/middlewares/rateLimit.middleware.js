import rateLimit from "express-rate-limit";

// S-05: sin esto, /auth/login y /auth/register no tenían ningún freno a fuerza bruta.
// Limitadores separados por ruta -- agotar el de login no debe afectar a quien solo
// intenta registrarse, y viceversa. Cuenta por req.ip -- detrás de un proxy real (Render,
// E10) hace falta `app.set('trust proxy', ...)` para que sea la IP real del cliente y no
// la del proxy; fuera de alcance de este fix, queda anotado para cuando se despliegue.
const authRateLimit = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: "Demasiados intentos, intenta de nuevo en unos minutos",
      });
    },
  });

export const loginRateLimit = authRateLimit();
export const registerRateLimit = authRateLimit();
