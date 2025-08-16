# SpeechCraft Processing Server

OpenAI-powered note processing service for SpeechCraft mobile app.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
```

### 2. Required Environment Variables
```env
# Server
NODE_ENV=development
PORT=3001

# Supabase (from your Supabase dashboard)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

# Security
API_SECRET_KEY=your-super-secret-api-key-here
```

### 3. Development
```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📡 API Endpoints

### Health Check
```http
GET /health
# No authentication required
```

### Process Note
```http
POST /api/process
Content-Type: application/json
X-API-Key: your-api-secret-key

{
  "noteId": "uuid-of-note-to-process"
}
```

### Get Processing Status
```http
GET /api/status/:noteId
X-API-Key: your-api-secret-key
```

### Get Statistics
```http
GET /api/stats
X-API-Key: your-api-secret-key (optional)
```

## 🔧 Configuration

### OpenAI Models
- **gpt-3.5-turbo**: Fast, cost-effective ($0.002/1K tokens)
- **gpt-4**: Higher quality, more expensive ($0.03/1K tokens)

### Note Types Supported
- **meeting**: Professional meeting notes with action items
- **todo**: Organized task lists with priorities
- **idea**: Structured creative ideas with development steps
- **general**: Enhanced general notes with improved formatting

### Rate Limiting
- **Global**: 20 requests/minute per IP
- **Processing**: 10 processing requests/minute
- **Authenticated users**: Higher limits

## 🛡️ Security Features

- API key authentication
- Rate limiting with IP-based tracking
- Request/response logging
- Input validation
- Error handling without data leakage
- Secure headers with Helmet.js

## 📊 Monitoring

### Logs
- Console output in development
- File logging in production (`logs/` directory)
- Structured JSON logs for production analysis

### Health Monitoring
```bash
# Check service health
curl http://localhost:3001/health

# Check detailed stats
curl -H "X-API-Key: your-key" http://localhost:3001/api/stats
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Troubleshooting

### Common Issues

1. **OpenAI API Key Invalid**
   - Check your API key at https://platform.openai.com/api-keys
   - Ensure you have billing set up

2. **Supabase Connection Failed**
   - Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
   - Check if your IP is allowed in Supabase settings

3. **Rate Limiting Issues**
   - Adjust RATE_LIMIT_MAX_REQUESTS in .env
   - Use proper API key for higher limits

4. **Processing Failures**
   - Check OpenAI account usage limits
   - Verify note exists in database
   - Check logs for detailed error messages

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check logs
tail -f logs/combined.log
```

## 📈 Performance

### Typical Processing Times
- **gpt-3.5-turbo**: 1-3 seconds
- **gpt-4**: 3-8 seconds
- **Fallback mode**: <100ms

### Resource Usage
- **Memory**: ~50-100MB base
- **CPU**: Low (mainly I/O bound)
- **Storage**: Minimal (logs only)

## 🔗 Integration

This server integrates with:
- **Supabase**: Database and authentication
- **OpenAI**: Text processing and enhancement
- **React Native App**: Via HTTP API calls
- **Monitoring Tools**: Via health endpoints and logs