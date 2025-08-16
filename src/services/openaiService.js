const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Note type prompts for different processing styles
    this.prompts = {
      meeting: `Transform this speech transcript into professional meeting notes:

Input: "{text}"

Please create:
1. **Key Discussion Points** - Main topics covered
2. **Decisions Made** - Clear decisions and conclusions
3. **Action Items** - Specific tasks with context
4. **Next Steps** - Follow-up actions needed

Format with clear headings, bullet points, and professional language.`,

      todo: `Convert this speech into actionable tasks:

Input: "{text}"

Please create:
1. **Priority Tasks** - Most important items first
2. **Quick Tasks** - Items that can be done quickly  
3. **Long-term Tasks** - Items requiring more time
4. **Context** - Additional details for each task

Format as an organized, prioritized task list.`,

      idea: `Enhance and structure this creative idea:

Input: "{text}"

Please organize into:
1. **Core Concept** - Main idea clearly stated
2. **Key Features** - Important aspects or components
3. **Potential Benefits** - Value and advantages
4. **Next Steps** - How to develop this idea further

Format as a structured idea document with clear sections.`,

      general: `Improve and format this note:

Input: "{text}"

Please:
1. **Fix grammar and clarity** - Make it readable
2. **Organize logically** - Structure the content
3. **Add proper formatting** - Use headings and bullets
4. **Enhance professional tone** - Make it polished

Format as a well-structured, professional note.`
    };
  }

  /**
   * Process a note with OpenAI based on note type
   * @param {string} originalText - The raw speech text
   * @param {string} noteType - Type of note (meeting, todo, idea, general)
   * @returns {Object} Processing result with enhanced text and metadata
   */
  async processNote(originalText, noteType = 'general') {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      if (!originalText || originalText.trim().length === 0) {
        throw new Error('Original text is required');
      }

      if (!this.prompts[noteType]) {
        logger.warn(`Unknown note type: ${noteType}, using general instead`);
        noteType = 'general';
      }

      // Build the prompt
      const prompt = this.prompts[noteType].replace('{text}', originalText.trim());
      
      logger.info('Starting OpenAI processing', { 
        noteType, 
        textLength: originalText.length 
      });

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional note-taking assistant. Transform speech into well-formatted, professional notes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: 0.3, // Lower temperature for more consistent formatting
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const processingTime = (Date.now() - startTime) / 1000;
      const tokensUsed = response.usage.total_tokens;
      const processedText = response.choices[0].message.content.trim();

      // Log successful processing
      logger.info('OpenAI processing completed successfully', {
        noteType,
        tokensUsed,
        processingTime: `${processingTime}s`,
        inputLength: originalText.length,
        outputLength: processedText.length
      });

      return {
        processedText,
        tokensUsed,
        processingTime,
        success: true,
        model: response.model,
        noteType
      };

    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000;
      
      logger.error('OpenAI processing failed', {
        error: error.message,
        noteType,
        processingTime: `${processingTime}s`,
        textLength: originalText ? originalText.length : 0
      });

      // Return fallback result
      return {
        processedText: this._createFallbackText(originalText, noteType),
        tokensUsed: 0,
        processingTime,
        success: false,
        error: error.message,
        noteType
      };
    }
  }

  /**
   * Create fallback formatted text when OpenAI fails
   * @param {string} originalText - Original text
   * @param {string} noteType - Type of note
   * @returns {string} Basic formatted text
   */
  _createFallbackText(originalText, noteType) {
    const cleanText = originalText.trim();
    
    // Basic formatting based on note type
    switch (noteType) {
      case 'meeting':
        return `# Meeting Notes\n\n**Discussion:**\n${cleanText}\n\n**Note:** Enhanced formatting temporarily unavailable.`;
      
      case 'todo':
        return `# Task List\n\n• ${cleanText.replace(/[.!?]/g, '\n• ')}\n\n**Note:** Enhanced formatting temporarily unavailable.`;
      
      case 'idea':
        return `# Creative Idea\n\n**Concept:**\n${cleanText}\n\n**Note:** Enhanced formatting temporarily unavailable.`;
      
      default:
        return `# Note\n\n${cleanText}\n\n**Note:** Enhanced formatting temporarily unavailable.`;
    }
  }

  /**
   * Validate OpenAI API connection
   * @returns {boolean} True if API key is valid
   */
  async validateApiKey() {
    try {
      await this.client.models.list();
      logger.info('OpenAI API key validation successful');
      return true;
    } catch (error) {
      logger.error('OpenAI API key validation failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Array} List of available models
   */
  async getAvailableModels() {
    try {
      const response = await this.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      logger.error('Failed to fetch available models', { error: error.message });
      return [];
    }
  }

  /**
   * Get service status and health
   * @returns {Object} Service health information
   */
  async getServiceHealth() {
    try {
      const isValid = await this.validateApiKey();
      
      return {
        status: isValid ? 'healthy' : 'unhealthy',
        apiKeyValid: isValid,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        availableNoteTypes: Object.keys(this.prompts)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        apiKeyValid: false
      };
    }
  }
}

module.exports = new OpenAIService();
