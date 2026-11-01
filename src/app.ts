import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// Security Middlewares - Disable strict CSP so browser JSON viewers and developer tools are not blocked
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Redirect /health to /api/v1/health for developer convenience
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

// API Routes
app.use('/api/v1', apiRouter);

// Root Welcome Route
app.get('/', (req, res) => {
  if (req.headers.accept?.includes('text/html')) {
    res.redirect('/api/v1/health');
    return;
  }
  res.json({
    name: 'ClientPulse SaaS API Engine',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'Running',
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
