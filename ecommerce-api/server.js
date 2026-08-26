import dotenv from 'dotenv';
import connectDB from './src/config/db.conf.js';
import app from './src/app.js';

dotenv.config();

const port = process.env.PORT || 4001;

connectDB();

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
  }
);
