import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.conf.js';
import productRoutes from './src/routes/product.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import addressRoutes from './src/routes/address.routes.js';
import paymentMethodRoutes from './src/routes/paymentMethod.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import wishlistRoutes from './src/routes/wishlist.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

connectDB();

app.get('/', (req, res) => {
    res.send('API Ecommerce with MongoDB');
  }
);

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(422).json({ message: err.message, errors: err.errors });
  }
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
  }
);

