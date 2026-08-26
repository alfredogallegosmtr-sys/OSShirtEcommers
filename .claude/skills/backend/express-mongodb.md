# Express + MongoDB - MERN Backend Stack

**Scope:** backend
**Trigger:** cuando se trabaje con Express, MongoDB, MERN stack, APIs RESTful con Node.js, o autenticación JWT
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

> Nota: guía general. Este repo (`ecommerce-api/`) usa **ES Modules** (no `require`), `bcrypt`
> (no `bcryptjs`) y formatos de respuesta propios. Para la convención real ver `../../code-patterns.md`.

---

## Propósito

Esta skill te guía para crear APIs RESTful robustas y escalables usando Express.js y MongoDB. Cubre desde setup hasta autenticación JWT, validaciones, manejo de errores y mejores prácticas de seguridad.

## Cuándo Usar Esta Skill

- Crear APIs REST para aplicaciones MERN
- Implementar autenticación y autorización con JWT
- Diseñar modelos de datos con Mongoose
- Configurar middleware de validación y error handling
- Conectar frontend React con backend Express
- Desarrollar endpoints CRUD completos
- Implementar relaciones entre documentos en MongoDB

## Stack Tecnológico

- **Express.js** 4.x - Framework web minimalista
- **MongoDB** 6.x+ - Base de datos NoSQL
- **Mongoose** 7.x+ - ODM para MongoDB
- **JWT** - Autenticación stateless
- **bcrypt** - Hash de passwords

### Setup Inicial

```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose dotenv cors
npm install bcryptjs jsonwebtoken
npm install express-validator
npm install -D nodemon
```

### Estructura Recomendada

```
backend/
├── src/
│   ├── config/db.js              # Configuración de MongoDB
│   ├── models/                   # User.js, Task.js
│   ├── controllers/              # authController.js, taskController.js
│   ├── routes/                   # auth.js, tasks.js
│   ├── middleware/               # auth.js, validation.js, errorHandler.js
│   ├── utils/helpers.js
│   └── server.js                 # Punto de entrada
├── .env / .env.example
├── .gitignore
└── package.json
```

## Flujo de Trabajo

### 1. Scripts package.json

```json
{ "scripts": { "start": "node src/server.js", "dev": "nodemon src/server.js", "test": "jest" } }
```

**.env:**
```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
```

### 2. Configurar MongoDB — `src/config/db.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 3. Server Principal — `src/server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use(errorHandler); // al final

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Modelos con Mongoose

### User Model — `src/models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please provide a name'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### Task Model (con relaciones) — `src/models/Task.js`

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
```

## Autenticación JWT

### Middleware — `src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `User role '${req.user.role}' is not authorized to access this route`,
    });
  }
  next();
};

module.exports = { protect, authorize };
```

### Auth Controller — `src/controllers/authController.js`

```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @route POST /api/auth/register  @access Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) { next(error); }
};

// @route POST /api/auth/login  @access Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) { next(error); }
};

// @route GET /api/auth/me  @access Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};
```

## Routes

```javascript
// src/routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
module.exports = router;

// src/routes/tasks.js
const express = require('express');
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect); // todas requieren auth
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
module.exports = router;
```

## Controller CRUD Completo — `src/controllers/taskController.js`

```javascript
const Task = require('../models/Task');

// GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) { next(error); }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized to access this task' });
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    await task.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) { next(error); }
};
```

## Error Handling — `src/middleware/errorHandler.js`

```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  if (process.env.NODE_ENV === 'development') console.error(err);

  if (err.name === 'CastError') error = { message: 'Resource not found', statusCode: 404 };
  if (err.code === 11000) error = { message: 'Duplicate field value entered', statusCode: 400 };
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
```

## Validación — `src/middleware/validation.js`

```javascript
const { body, validationResult } = require('express-validator');

exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.validateLogin = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| MongoServerError: E11000 | Duplicate key | Verificar uniqueness antes de insertar |
| CastError: Cast to ObjectId failed | ID inválido | Validar formato de ID antes de query |
| ValidationError | Datos inválidos | Validación en modelo y middleware |
| UnhandledPromiseRejection | Async sin catch | try-catch o errorHandler |
| CORS errors | Missing headers | Configurar cors() correctamente |
| JWT expired | Token expirado | Implementar refresh token |

## Seguridad Best Practices

```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
app.use('/api/', limiter);

const helmet = require('helmet');
app.use(helmet());

const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

## Checklist de Validación

- [ ] Autenticación implementada si es necesario
- [ ] Validación de input completa
- [ ] Manejo de errores con try-catch
- [ ] Status codes HTTP correctos (200, 201, 400, 401, 404, 500)
- [ ] Responses consistentes
- [ ] No exponer información sensible
- [ ] Logs apropiados (sin passwords/tokens)
- [ ] Ownership verificado (user puede acceder al recurso)
