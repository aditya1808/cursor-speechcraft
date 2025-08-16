const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const processingController = require('./controllers/processingController');
const { apiKeyAuth, optionalAuth, logAuthAttempts } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Log large payloads
    if (buf.length > 1024 * 1024) { // 1MB
      logger.warn('Large request body', { 
        size: `${(buf.length / 1024 / 1024).toFixed(2)}MB`,
        url: req.originalUrl,
        method: req.method
      });
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
});

// Rate limiting
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20, // 20 requests per minute
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please slow down',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.msBeforeNext / 1000) || 60
    });
  }
});

// Apply global rate limiting
app.use(globalRateLimit);

// Processing-specific rate limit (more restrictive)
const processingRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // Max 10 processing requests per minute
  message: {
    success: false,
    message: 'Too many processing requests, please try again later',
    error: 'PROCESSING_RATE_LIMIT'
  },
  keyGenerator: (req) => {
    // Rate limit by API key if present, otherwise by IP
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    return apiKey ? `api_key:${apiKey}` : `ip:${req.ip}`;
  }
});

// Health check (no authentication required)
app.get('/health', processingController.healthCheck);
app.get('/api/health', processingController.healthCheck);

// Basic server info (no authentication required)
app.get('/', (req, res) => {
  res.json({
    service: 'SpeechCraft Processing Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      process: 'POST /api/process (requires API key)',
      status: 'GET /api/status/:noteId (requires API key)', 
      stats: 'GET /api/stats (optional API key)'
    }
  });
});

// Protected processing endpoints
app.post('/api/process', 
  logAuthAttempts,
  processingRateLimit,
  apiKeyAuth,
  processingController.processNote
);

app.get('/api/status/:noteId',
  logAuthAttempts,
  apiKeyAuth,
  processingController.getProcessingStatus
);

// Stats endpoint (optional authentication for more detailed info)
app.get('/api/stats',
  logAuthAttempts,
  optionalAuth,
  processingController.getStats
);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { 
    method: req.method, 
    url: req.originalUrl,
    ip: req.ip 
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'POST /api/process',
      'GET /api/status/:noteId',
      'GET /api/stats'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.logError(error, {
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_ERROR',
    details: isDevelopment ? {
      message: error.message,
      stack: error.stack
    } : undefined,
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 SpeechCraft Processing Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });
  
  // Log configuration status
  const config = {
    supabaseConfigured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyConfigured: !!process.env.API_SECRET_KEY,
    rateLimiting: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS || '60000',
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '20'
    }
  };
  
  logger.info('Server configuration', config);
  
  if (!config.supabaseConfigured) {
    logger.warn('⚠️  Supabase not configured - set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  }
  
  if (!config.openaiConfigured) {
    logger.warn('⚠️  OpenAI not configured - set OPENAI_API_KEY');
  }
  
  if (!config.apiKeyConfigured) {
    logger.warn('⚠️  API security not configured - set API_SECRET_KEY');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.logError(error, { context: 'server_startup' });
  }
  process.exit(1);
});

module.exports = app;
