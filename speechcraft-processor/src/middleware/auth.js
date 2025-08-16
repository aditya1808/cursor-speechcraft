const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    logger.warn('Request without API key', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    logger.warn('Request with invalid API key', { ip: req.ip, apiKey });
    return res.status(401).json({
      error: 'Unauthorized', 
      message: 'Invalid API key'
    });
  }
  
  next();
};

module.exports = authMiddleware;
