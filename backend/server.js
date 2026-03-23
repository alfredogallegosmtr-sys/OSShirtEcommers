import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.conf.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

connectDB();

app.get('/', (req, res) => {
    res.send('API Ecommerce with MongoDB');
  }
);

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
  }
);

