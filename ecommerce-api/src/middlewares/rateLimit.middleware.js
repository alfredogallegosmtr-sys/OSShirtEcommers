import rateLimit from "express-rate-limit";

// S-05: sin esto, /auth/login y /auth/register no tenían ningún freno a fuerza bruta.
// Factory genérica (reusada también por clientLogRateLimit, ver abajo) -- cuenta por
// req.ip -- detrás de un proxy real (Render, E10) hace falta `app.set('trust proxy', ...)`
// para que sea la IP real del cliente y no la del proxy; fuera de alcance de este fix,
// queda anotado para cuando se despliegue.
const createRateLimit = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ message });
    },
  });

// Limitadores separados por ruta -- agotar el de login no debe afectar a quien solo
// intenta registrarse, y viceversa.
const authRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Demasiados intentos, intenta de nuevo en unos minutos",
};

export const loginRateLimit = createRateLimit(authRateLimitOptions);
export const registerRateLimit = createRateLimit(authRateLimitOptions);

// POST /api/logs/client es público (los errores pasan también sin sesión) -- sin este
// límite sería un sumidero de escritura sin control. 30/min/IP es generoso para
// diagnóstico real de un usuario, pero acota un flood scripteado.
export const clientLogRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  message: "Demasiados eventos de log, intenta de nuevo más tarde",
});
