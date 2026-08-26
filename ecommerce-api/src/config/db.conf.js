import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI
//    const conn = await mongoose.connect(
//    'mongodb://localhost:27017/ecommerce-OSShirts',
    );
    console.log(`MongoDB connected ${connection.connection.host}`);
    console.log(`MongoDB name ${connection.connection.name}`);
    console.log(`MongoDB port ${connection.connection.port}`);
//    console.log(`MongoDB connected ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting MongoDB');
    process.exit(1);
  }
};

export default connectDB;