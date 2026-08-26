# MongoDB Patterns - Database Design

**Scope:** backend
**Trigger:** cuando se diseñen schemas de MongoDB, se implementen relaciones entre documentos, o se optimicen queries
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para diseñar schemas eficientes en MongoDB y Mongoose. Cubre patrones de relaciones, indexación, aggregation pipeline, transacciones y optimización de queries.

## Cuándo Usar Esta Skill

- Diseñar schema de base de datos para nueva feature
- Decidir entre embedded vs referenced documents
- Optimizar queries lentas
- Implementar relaciones complejas
- Usar aggregation pipeline para reportes
- Configurar índices para performance
- Implementar transacciones multi-documento

## Filosofía de MongoDB

**Document-Oriented:** datos relacionados se almacenan juntos; evita JOINs cuando sea posible; la
desnormalización es común y buena práctica.
**Flexible Schema:** no requiere estructura fija; documentos en la misma colección pueden tener
diferentes campos; la evolución del schema es fácil.

## Patrones de Relaciones

### 1. Embedded Documents (One-to-Few)

**Cuándo usar:** relación 1:N donde N es pequeño (< 100); los datos embedded se acceden siempre con
el padre; no crecen sin límite.

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  addresses: [
    { street: String, city: String, zipCode: String, type: { type: String, enum: ['home', 'work'] } }
  ],
});

const user = await User.findById(userId);
console.log(user.addresses);
```

Ventajas: query sencilla (un fetch), atomic operations, mejor performance de lectura.
Desventajas: documento puede crecer mucho (límite 16MB); no se puede referenciar sub-documento directamente.

### 2. Child Referencing (One-to-Many)

**Cuándo usar:** N grande (100+); los child se acceden independientemente; pueden estar en múltiples parents.

```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const posts = await Post.find({ author: userId }).populate('author', 'name email').sort({ createdAt: -1 });
```

Ventajas: sin límite de tamaño, child independientes, escalable.
Desventajas: requiere múltiples queries (o populate), no atomic por defecto.

### 3. Parent Referencing (One-to-Many Inverso)

```javascript
const commentSchema = new mongoose.Schema({
  text: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  createdAt: { type: Date, default: Date.now },
});

const comments = await Comment.find({ post: postId }).populate('author', 'name').sort({ createdAt: -1 });
```

### 4. Two-Way Referencing (Many-to-Many)

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
});
const courseSchema = new mongoose.Schema({
  title: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const user = await User.findById(userId).populate('enrolledCourses');
const course = await Course.findById(courseId).populate('students');
```

Importante: mantener ambos lados sincronizados.

```javascript
userSchema.methods.enrollInCourse = async function(courseId) {
  this.enrolledCourses.push(courseId);
  await this.save();
  await Course.findByIdAndUpdate(courseId, { $addToSet: { students: this._id } });
};
```

### 5. Denormalization Pattern

**Cuándo usar:** lecturas muy frecuentes; datos que no cambian mucho; dispuesto a sacrificar
consistencia por performance.

```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,   // Denormalizado
    avatar: String, // Denormalizado
  },
  likes: Number,
  createdAt: { type: Date, default: Date.now },
});

const posts = await Post.find().sort({ createdAt: -1 }); // sin populate

// Mantener sincronizado cuando cambia el origen
userSchema.post('save', async function() {
  if (this.isModified('name')) {
    await Post.updateMany({ 'author.id': this._id }, { $set: { 'author.name': this.name } });
  }
});
```

## Indexación para Performance

```javascript
// Single Field
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Compound
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

// Text (búsqueda)
postSchema.index({ title: 'text', content: 'text' });
const results = await Post.find({ $text: { $search: 'mongodb tutorial' } });

// Unique
userSchema.index({ email: 1 }, { unique: true });

// Sparse (solo documentos con el campo)
userSchema.index({ phoneNumber: 1 }, { sparse: true });
```

Regla de prefijos: el índice `{ a: 1, b: 1, c: 1 }` sirve para `{a}`, `{a,b}`, `{a,b,c}`, pero NO
para `{b}` o `{c}`. Evita índices redundantes (`{user:1}` queda cubierto por `{user:1,status:1}`).

### Analizar Performance

```javascript
const explain = await Post.find({ author: userId }).sort({ createdAt: -1 }).explain('executionStats');
console.log(explain.executionStats.totalDocsExamined);
console.log(explain.executionStats.executionTimeMillis);
// Si totalDocsExamined >> nReturned, necesitas índice
```

## Aggregation Pipeline

```javascript
// 1. Group By y Count
const postsByUser = await Post.aggregate([
  { $group: { _id: '$author', count: { $sum: 1 }, totalLikes: { $sum: '$likes' } } },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);

// 2. Lookup (JOIN)
const postsWithAuthors = await Post.aggregate([
  { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorInfo' } },
  { $unwind: '$authorInfo' },
  { $project: { title: 1, content: 1, 'authorInfo.name': 1, 'authorInfo.email': 1 } },
]);

// 3. Match + Project con $switch
const activePosts = await Post.aggregate([
  { $match: { status: 'active', likes: { $gte: 10 } } },
  { $project: {
      title: 1, likes: 1,
      likesCategory: { $switch: { branches: [
        { case: { $lt: ['$likes', 10] }, then: 'low' },
        { case: { $lt: ['$likes', 50] }, then: 'medium' },
      ], default: 'high' } }
  } },
  { $sort: { likes: -1 } },
]);

// 4. Estadísticas por mes
const stats = await Order.aggregate([
  { $match: { createdAt: { $gte: new Date('2024-01-01') }, status: 'completed' } },
  { $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$total' }, avgOrderValue: { $avg: '$total' },
  } },
  { $sort: { '_id.year': -1, '_id.month': -1 } },
]);
```

## Transacciones

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Account.findByIdAndUpdate(fromAccountId, { $inc: { balance: -amount } }, { session });
  await Account.findByIdAndUpdate(toAccountId, { $inc: { balance: amount } }, { session });
  await Transaction.create([{ from: fromAccountId, to: toAccountId, amount, timestamp: new Date() }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Patrones Avanzados

### Bucket Pattern (series temporales)

Agrupar readings en buckets (p. ej. por hora) en lugar de un documento por reading.

```javascript
{
  sensor: 'A',
  date: ISODate('2024-01-01T10:00:00'),
  measurements: [ { temp: 20, time: ISODate('...') }, /* hasta 3600 readings */ ]
}
```

### Computed Pattern (pre-calcular)

```javascript
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.tax = this.subtotal * 0.16;
  this.total = this.subtotal + this.tax;
  next();
});
```

### Polymorphic Pattern

```javascript
const contentSchema = new mongoose.Schema({
  type: { type: String, enum: ['article', 'video', 'image'], required: true },
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  article: { text: String, wordCount: Number },
  video: { url: String, duration: Number },
  image: { url: String, width: Number, height: Number },
}, { discriminatorKey: 'type' });
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Document too large (>16MB) | Demasiados embedded docs | Usar referencing |
| Slow queries | Sin índices apropiados | Analizar con .explain() y agregar índices |
| Memory leak en queries | Cursor sin cerrar | Usar .lean() o streams |
| Inconsistent data | Update de denormalized data | Transactions o middleware hooks |
| N+1 queries | Populate en loops | Populate con arrays o aggregation |

## Checklist de Schema Design

- [ ] Relación correcta (embedded vs referenced)
- [ ] Índices necesarios definidos
- [ ] Validaciones en el schema
- [ ] Valores por defecto apropiados
- [ ] Timestamps (createdAt, updatedAt)
- [ ] Soft delete si es necesario (deletedAt)
- [ ] Índice unique donde corresponde
- [ ] Pre/Post hooks si se requieren
- [ ] Métodos custom documentados
- [ ] Schema probado con datos reales

## Best Practices

1. Diseña para tus query patterns, no para normalización perfecta
2. Denormaliza cuando read >> write
3. Indexa estratégicamente (no todos los campos)
4. Usa `lean()` para read-only (más rápido)
5. Batch operations con `bulkWrite()`
6. Monitorea slow queries (profiling)
7. Usa projections (no retornes campos innecesarios)
8. Considera TTL indexes para datos temporales (sessions, logs)
