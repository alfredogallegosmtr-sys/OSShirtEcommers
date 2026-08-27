import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
app.use('/img', express.static(path.join(__dirname, '..', 'public', 'img')));

app.get('/', (req, res) => {
    res.send('API Ecommerce with MongoDB');
  }
);

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
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
