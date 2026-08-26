# Node.js Best Practices - Production Ready Code

**Scope:** backend
**Trigger:** cuando se trabaje con Node.js, se configure un proyecto backend, o se necesiten mejores prácticas de Node
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para escribir código Node.js de producción siguiendo las mejores prácticas de la industria. Cubre estructura de proyecto, manejo de errores, logging, seguridad, performance y deployment.

## Cuándo Usar Esta Skill

- Configurar nuevo proyecto Node.js
- Implementar logging y monitoring
- Optimizar performance de aplicaciones Node
- Preparar código para producción
- Debuggear memory leaks o performance issues
- Configurar variables de entorno
- Implementar graceful shutdown

## Estructura de Proyecto Profesional

```
project-root/
├── src/
│   ├── config/           # Configuraciones
│   ├── controllers/      # Lógica de negocio
│   ├── middleware/       # Middleware personalizado
│   ├── models/           # Modelos de datos
│   ├── routes/           # Definición de rutas
│   ├── services/         # Servicios externos
│   ├── utils/            # Utilidades y helpers
│   ├── validators/       # Validaciones
│   └── server.js         # Entry point
├── tests/                # unit / integration / e2e
├── logs/
├── .env / .env.example
├── .eslintrc.js / .prettierrc / .gitignore
├── package.json
└── README.md
```

## Variables de Entorno — `config/index.js`

```javascript
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  db: { uri: process.env.MONGO_URI, options: { useNewUrlParser: true, useUnifiedTopology: true } },
  jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRE || '7d' },
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' },
  logging: { level: process.env.LOG_LEVEL || 'info' },
};

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = config;
```

## Logging Profesional (Winston) — `config/logger.js`

```javascript
const winston = require('winston');
const path = require('path');
const logDir = 'logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) =>
    `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
  )
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.DailyRotateFile({ filename: path.join(logDir, 'error-%DATE%.log'), datePattern: 'YYYY-MM-DD', level: 'error', maxFiles: '14d' }),
    new winston.transports.DailyRotateFile({ filename: path.join(logDir, 'combined-%DATE%.log'), datePattern: 'YYYY-MM-DD', maxFiles: '14d' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
```

Uso: `logger.info('Server started', { port: 5000 })`, `logger.error('DB failed', { error: err.message })`.

## Error Handling Robusto

### Clase de Error — `utils/AppError.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
```

### Error Handler Global — `middleware/errorHandler.js`

```javascript
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({ success: false, status: err.status, error: err, message: err.message, stack: err.stack });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ success: false, status: err.status, message: err.message });
  } else {
    logger.error('ERROR', { error: err });
    res.status(500).json({ success: false, status: 'error', message: 'Something went wrong' });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') return sendErrorDev(err, res);

  let error = { ...err };
  error.message = err.message;
  if (err.name === 'CastError') error = new AppError('Invalid ID format', 400);
  if (err.code === 11000) error = new AppError(`Duplicate field value: ${Object.keys(err.keyValue)[0]}`, 400);
  if (err.name === 'ValidationError') error = new AppError(`Invalid input data: ${Object.values(err.errors).map((e) => e.message).join('. ')}`, 400);
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Token expired', 401);
  sendErrorProd(error, res);
};

module.exports = errorHandler;
```

### Async Error Wrapper — `utils/catchAsync.js`

```javascript
const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);
module.exports = catchAsync;

// Uso
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ success: true, data: user });
});
```

## Optimización de Performance

### Event Loop

```javascript
// MAL - bloquea el event loop
app.get('/bad', (req, res) => { const r = heavySyncOperation(); res.json(r); });

// BIEN - async / non-blocking
app.get('/good', async (req, res) => { const r = await heavyAsyncOperation(); res.json(r); });

// CPU-intensive: worker threads
const { Worker } = require('worker_threads');
app.get('/heavy', (req, res) => {
  const worker = new Worker('./heavy-task.js');
  worker.on('message', (result) => res.json(result));
  worker.on('error', (error) => res.status(500).json({ error: error.message }));
  worker.postMessage(req.body);
});
```

### Caching simple (NodeCache)

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });

exports.getUsers = catchAsync(async (req, res) => {
  const cached = cache.get('all_users');
  if (cached) return res.status(200).json({ success: true, cached: true, data: cached });
  const users = await User.find();
  cache.set('all_users', users);
  res.status(200).json({ success: true, cached: false, data: users });
});
```

### Connection Pooling (Mongoose)

```javascript
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true,
  maxPoolSize: 10, minPoolSize: 5, socketTimeoutMS: 45000, serverSelectionTimeoutMS: 5000,
});
```

## Seguridad

```javascript
// Rate limiting (con Redis store para apps escalables)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests from this IP' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true, message: 'Too many login attempts' });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Helmet
const helmet = require('helmet');
app.use(helmet());

// Sanitización
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
app.use(mongoSanitize());
app.use(xss());
```

## Graceful Shutdown — `server.js`

```javascript
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { error: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => logger.info('Process terminated!'));
});
```

## Scripts package.json

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "format": "prettier --write \"**/*.js\""
  }
}
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Memory leak | Event listeners no removidos | Cleanup listeners |
| Blocked event loop | Operación síncrona pesada | async o worker threads |
| Unhandled rejection | Promise sin .catch() | try-catch o catchAsync |
| Port already in use | Puerto ocupado | Cambiar puerto o matar proceso |
| ECONNREFUSED | DB no disponible | Verificar conexión y credenciales |

## Checklist de Production

- [ ] Variables de entorno configuradas
- [ ] Logging implementado (Winston/Bunyan)
- [ ] Error handling global
- [ ] Graceful shutdown implementado
- [ ] Rate limiting configurado
- [ ] Security headers (Helmet)
- [ ] Input sanitization
- [ ] CORS configurado correctamente
- [ ] Tests escritos (>70% coverage)
- [ ] Environment de staging probado
- [ ] Monitoring configurado (PM2, New Relic)
- [ ] Logs centralizados (ELK, Datadog)

## Best Practices Summary

1. Async/await everywhere (nunca bloquear el event loop)
2. Proper error handling (try-catch, error middleware)
3. Environment variables (nunca hardcodear secrets)
4. Logging estructurado (Winston)
5. Seguridad (Helmet, rate limiting, sanitization)
6. Testing (unit, integration, e2e)
7. Linting (ESLint + Prettier)
8. Graceful shutdown (manejar SIGTERM)
9. Monitoring
10. Documentación (README, API docs, comentarios)
