import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean) : [])
  : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', routes);

if (hasClientBuild) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to MongoDB and start server
async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    } else {
      console.log('MongoDB URI not provided - running without database');
      console.log('Auth features will be unavailable');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    // Start server even without DB for development
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without database)`);
    });
  }
}

start();