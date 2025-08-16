const logger = require('../utils/logger');

/**
 * Simple API key authentication middleware
 * Protects internal processing endpoints
 */
const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      logger.warn('API request without key', { 
        method: req.method, 
        url: req.originalUrl,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'API key required',
        error: 'MISSING_API_KEY'
      });
    }

    const expectedApiKey = process.env.API_SECRET_KEY;
    
    if (!expectedApiKey) {
      logger.error('API_SECRET_KEY not configured in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'CONFIG_ERROR'
      });
    }

    if (apiKey !== expectedApiKey) {
      logger.warn('Invalid API key attempt', { 
        method: req.method, 
        url: req.originalUrl,
        ip: req.ip,
        providedKey: apiKey.substring(0, 8) + '...' // Log partial key for debugging
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        error: 'INVALID_API_KEY'
      });
    }

    // API key is valid, continue to next middleware
    logger.debug('API key authenticated', { 
      method: req.method, 
      url: req.originalUrl 
    });
    
    next();
  } catch (error) {
    logger.logError(error, { 
      action: 'apiKeyAuth', 
      method: req.method, 
      url: req.originalUrl 
    });
    
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication for non-critical endpoints
 * Allows requests to proceed but logs authentication attempts
 */
const optionalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    // Try to authenticate but don't block if it fails
    const expectedApiKey = process.env.API_SECRET_KEY;
    
    if (apiKey === expectedApiKey) {
      req.authenticated = true;
      logger.debug('Optional auth successful', { 
        method: req.method, 
        url: req.originalUrl 
      });
    } else {
      req.authenticated = false;
      logger.debug('Optional auth failed', { 
        method: req.method, 
        url: req.originalUrl 
      });
    }
  } else {
    req.authenticated = false;
  }
  
  next();
};

/**
 * Rate limiting specifically for authenticated requests
 * More lenient limits for authenticated users
 */
const authenticatedRateLimit = (req, res, next) => {
  // This is a placeholder for more sophisticated rate limiting
  // In production, you might want to use Redis-based rate limiting
  
  if (req.authenticated) {
    // Authenticated users get higher limits
    req.rateLimit = {
      max: 100, // 100 requests per window
      windowMs: 60000 // 1 minute
    };
  } else {
    // Unauthenticated requests get lower limits
    req.rateLimit = {
      max: 20, // 20 requests per window
      windowMs: 60000 // 1 minute
    };
  }
  
  next();
};

/**
 * Development mode authentication bypass
 * Only use in development environment
 */
const devBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Development mode: bypassing authentication', { 
      method: req.method, 
      url: req.originalUrl 
    });
    req.authenticated = true;
    return next();
  }
  
  // In production, proceed with normal authentication
  return apiKeyAuth(req, res, next);
};

/**
 * Middleware to log all authentication attempts
 */
const logAuthAttempts = (req, res, next) => {
  const hasApiKey = !!(req.headers['x-api-key'] || req.headers['authorization']);
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;
  
  logger.info('Authentication attempt', {
    method: req.method,
    url: req.originalUrl,
    hasApiKey,
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  });
  
  next();
};

module.exports = {
  apiKeyAuth,
  optionalAuth,
  authenticatedRateLimit,
  devBypass,
  logAuthAttempts
};
