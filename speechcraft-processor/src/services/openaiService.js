const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your-openai-api-key') {
      logger.warn('OpenAI not configured - running in test mode');
      this.openai = null;
      this.testMode = true;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.testMode = false;
    }
  }

  async processNote(originalText, noteType = 'general') {
    if (this.testMode) {
      logger.info('TEST MODE: Would process note with OpenAI', { noteType, textLength: originalText.length });
      
      const mockProcessedText = `[TEST MODE - AI PROCESSED]\n\n**Enhanced ${noteType} note:**\n\n${originalText}\n\n**Key Points:**\n- This is a simulated AI enhancement\n- Original text preserved\n- Note type: ${noteType}\n- This would normally be processed by OpenAI`;
      
      return {
        processedText: mockProcessedText,
        tokensUsed: Math.floor(originalText.length / 4), // Rough token estimate
        processingTime: 0.5
      };
    }
    
    try {
      const startTime = Date.now();
      
      const prompts = {
        meeting: `Please clean up and structure this meeting transcript. Format it with clear sections for key points, action items, and decisions made. Keep the original meaning but make it professional and well-organized:\n\n${originalText}`,
        
        todo: `Please convert this voice note into a clear, actionable todo list. Break down tasks into specific steps if needed, and organize by priority if mentioned:\n\n${originalText}`,
        
        idea: `Please expand and refine this idea. Add structure, potential next steps, and flesh out the concept while maintaining the original creative intent:\n\n${originalText}`,
        
        general: `Please clean up and improve this voice note. Fix any grammar, make it more readable, and organize the content logically while preserving all the original information:\n\n${originalText}`
      };

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that improves voice notes and transcripts. Always maintain the original meaning and information while making the text clearer and better organized.'
          },
          {
            role: 'user',
            content: prompts[noteType] || prompts.general
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const processedText = response.choices[0]?.message?.content || originalText;
      const tokensUsed = response.usage?.total_tokens || 0;
      const processingTime = (Date.now() - startTime) / 1000;

      logger.info('Note processed successfully', {
        noteType,
        tokensUsed,
        processingTime,
        originalLength: originalText.length,
        processedLength: processedText.length
      });

      return {
        processedText,
        tokensUsed,
        processingTime
      };

    } catch (error) {
      logger.error('OpenAI processing error:', error);
      
      // Return original text if OpenAI fails
      return {
        processedText: originalText,
        tokensUsed: 0,
        processingTime: 0,
        error: error.message
      };
    }
  }
}

module.exports = new OpenAIService();
