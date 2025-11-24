import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config({ path: '../.env.local' });

// Import routes
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';

// Import database
import { pool, closePool } from './config/database';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:12000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 LeadGen-AI Backend API Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`🔒 JWT Secret: ${process.env.JWT_SECRET ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📚 API Endpoints:');
  console.log('   POST   /api/auth/signup     - Create account');
  console.log('   POST   /api/auth/login      - Login');
  console.log('   GET    /api/auth/me         - Get current user');
  console.log('   GET    /api/leads           - List leads');
  console.log('   POST   /api/leads/generate  - Generate AI leads');
  console.log('   POST   /api/leads           - Create lead');
  console.log('   GET    /api/leads/:id       - Get lead');
  console.log('   PUT    /api/leads/:id       - Update lead');
  console.log('   DELETE /api/leads/:id       - Delete lead');
  console.log('═══════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closePool();
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
