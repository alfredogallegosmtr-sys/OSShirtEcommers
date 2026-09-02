import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import authRoutes from './routes/auth.routes.js';
import cartRoutes from './routes/cart.routes.js';
import addressRoutes from './routes/address.routes.js';
import paymentMethodRoutes from './routes/paymentMethod.routes.js';
import orderRoutes from './routes/order.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import userRoutes from './routes/user.routes.js';
import logRoutes from './routes/log.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

function getAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || getAllowedOrigins().includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
}));
app.use(express.json());
// El Cross-Origin-Resource-Policy: same-origin que pone helmet por defecto bloquea que el
// frontend (origen distinto, :3001) cargue estas imágenes en <img> -- son estáticos públicos,
// pensados justamente para cargarse cross-origin.
app.use(
  '/img',
  helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
  express.static(path.join(__dirname, '..', 'public', 'img')),
);

app.get('/', (req, res) => {
    res.send('API Ecommerce with MongoDB');
  }
);

// Refleja conectividad real a Mongo, no solo que el proceso esté vivo -- el fallo más
// ensayado de este proyecto (2 simulacros reales contra Atlas) es justo la caída de la
// base de datos, no la caída del propio servidor Node.
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState; // 1 = connected
  const dbStatus = readyState === 1 ? 'up' : 'down';
  res.status(dbStatus === 'up' ? 200 : 503).json({
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: { status: dbStatus, readyState },
  });
});

// Swagger UI nunca se expone abierto en producción salvo que se habilite a propósito
// (ENABLE_DOCS=true) — evita filtrar la forma de la API a cualquiera en un despliegue real.
const docsEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true';
if (docsEnabled) {
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
  // swagger-ui-express sirve HTML con estilos/scripts inline; el CSP de helmet ya
  // quedó fijado por el middleware global de arriba, así que hay que quitarlo (no
  // basta con "desactivarlo" en un helmet() nuevo, eso no borra un header ya puesto).
  app.use(
    '/api-docs',
    (req, res, next) => {
      res.removeHeader('Content-Security-Policy');
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec),
  );
}

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Express solo reconoce un error handler por su arity de 4 parámetros;
// "_next" debe existir aunque nunca se llame.
app.use((err, req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(422).json({ message: err.message, errors: err.errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = field ? err.keyValue[field] : undefined;
    return res.status(422).json({
      message: field
        ? `El valor de "${field}" ya está en uso: "${value}"`
        : 'Valor duplicado',
    });
  }
  if (err.name === 'InsufficientStockError') {
    return res.status(422).json({ message: err.message });
  }
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
