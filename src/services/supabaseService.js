const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  /**
   * Update note with processing results
   * @param {string} noteId - UUID of the note
   * @param {Object} data - Processing data to update
   * @returns {Promise<Object>} Updated note data
   */
  async updateNoteProcessing(noteId, data) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Add provided fields
      if (data.processedText !== undefined) {
        updateData.processed_text = data.processedText;
      }
      
      if (data.status !== undefined) {
        updateData.processing_status = data.status;
      }
      
      if (data.tokensUsed !== undefined) {
        updateData.tokens_used = data.tokensUsed;
      }
      
      if (data.processingTime !== undefined) {
        updateData.processing_time = data.processingTime;
      }

      const { data: updatedNote, error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update note processing', { 
          noteId, 
          error: error.message 
        });
        throw error;
      }

      logger.info('Note processing updated successfully', { 
        noteId, 
        status: updateData.processing_status 
      });
      
      return updatedNote;
    } catch (error) {
      logger.error('Error updating note processing', { 
        noteId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get note by ID
   * @param {string} noteId - UUID of the note
   * @returns {Promise<Object>} Note data
   */
  async getNoteById(noteId) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Note not found', { noteId });
          return null;
        }
        logger.error('Failed to get note by ID', { 
          noteId, 
          error: error.message 
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting note by ID', { 
        noteId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Increment user's monthly note count
   * @param {string} userId - UUID of the user
   * @returns {Promise<void>}
   */
  async incrementUserNoteCount(userId) {
    try {
      const { error } = await this.supabase.rpc('increment_note_count', {
        user_id: userId
      });

      if (error) {
        logger.error('Failed to increment user note count', { 
          userId, 
          error: error.message 
        });
        throw error;
      }

      logger.info('User note count incremented', { userId });
    } catch (error) {
      logger.error('Error incrementing user note count', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Check user limits and subscription status
   * @param {string} userId - UUID of the user
   * @returns {Promise<Object>} User limits information
   */
  async checkUserLimits(userId) {
    try {
      const { data, error } = await this.supabase.rpc('check_user_limits', {
        user_id: userId
      });

      if (error) {
        logger.error('Failed to check user limits', { 
          userId, 
          error: error.message 
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error checking user limits', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - UUID of the user
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('User profile not found', { userId });
          return null;
        }
        logger.error('Failed to get user profile', { 
          userId, 
          error: error.message 
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting user profile', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create a new note (used for testing)
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .insert({
          user_id: noteData.userId,
          original_text: noteData.originalText,
          note_type: noteData.noteType || 'general',
          processing_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create note', { error: error.message });
        throw error;
      }

      logger.info('Note created successfully', { noteId: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating note', { error: error.message });
      throw error;
    }
  }

  /**
   * Get processing statistics
   * @returns {Promise<Object>} Processing statistics
   */
  async getProcessingStats() {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('processing_status, note_type, tokens_used, processing_time')
        .not('processing_status', 'eq', 'pending');

      if (error) {
        logger.error('Failed to get processing stats', { error: error.message });
        throw error;
      }

      // Calculate statistics
      const stats = {
        totalProcessed: data.length,
        statusCounts: {},
        typeDistribution: {},
        totalTokensUsed: 0,
        averageProcessingTime: 0
      };

      let totalTime = 0;
      let timeCount = 0;

      data.forEach(note => {
        // Status counts
        stats.statusCounts[note.processing_status] = 
          (stats.statusCounts[note.processing_status] || 0) + 1;
        
        // Type distribution
        stats.typeDistribution[note.note_type] = 
          (stats.typeDistribution[note.note_type] || 0) + 1;
        
        // Token usage
        stats.totalTokensUsed += note.tokens_used || 0;
        
        // Processing time
        if (note.processing_time) {
          totalTime += note.processing_time;
          timeCount++;
        }
      });

      stats.averageProcessingTime = timeCount > 0 ? totalTime / timeCount : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting processing stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('count', { count: 'exact', head: true });

      if (error) {
        logger.error('Database connection test failed', { error: error.message });
        return false;
      }

      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test error', { error: error.message });
      return false;
    }
  }

  /**
   * Get service health
   * @returns {Promise<Object>} Service health status
   */
  async getServiceHealth() {
    try {
      const isConnected = await this.testConnection();
      const stats = isConnected ? await this.getProcessingStats() : null;

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        connected: isConnected,
        database: {
          url: process.env.SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
        },
        stats
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new SupabaseService();
