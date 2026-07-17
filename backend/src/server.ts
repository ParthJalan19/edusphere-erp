import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import app from './app.js';

dns.setDefaultResultOrder('ipv4first');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Configure dotenv
dotenv.config();

const port = process.env.PORT || 5000;
const databaseUri = process.env.MONGODB_URI;

if (!databaseUri) {
  console.error('ERROR: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

// Connect to database
mongoose
  .connect(databaseUri)
  .then(() => {
    console.log('MongoDB connection successful! 💾');
  })
  .catch((err) => {
    console.error('MongoDB connection error: ', err);
    process.exit(1);
  });

const server = app.listen(port, () => {
  console.log(
    `Application running in ${process.env.NODE_ENV || 'development'} mode on port ${port} 🚀`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: unknown) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
  if (err instanceof Error) {
    console.error(err.name, err.message);
  } else {
    console.error(err);
  }
  server.close(() => {
    process.exit(1);
  });
});
