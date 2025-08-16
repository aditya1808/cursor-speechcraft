const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-project-url' || supabaseKey === 'your-supabase-service-role-key') {
      logger.warn('Supabase not configured - running in test mode');
      this.supabase = null;
      this.testMode = true;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.testMode = false;
    }
  }

  async updateNoteProcessing(noteId, updates) {
    if (this.testMode) {
      logger.info('TEST MODE: Would update note', { noteId, updates });
      return { id: noteId, ...updates, updated_at: new Date().toISOString() };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating note:', error);
      throw error;
    }
  }

  async getNoteById(noteId) {
    if (this.testMode) {
      logger.info('TEST MODE: Would fetch note', { noteId });
      return {
        id: noteId,
        user_id: 'test-user-id',
        original_text: 'This is a test voice note about productivity and meeting notes.',
        processing_status: 'pending',
        note_type: 'general',
        created_at: new Date().toISOString()
      };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching note:', error);
      throw error;
    }
  }

  async incrementUserNoteCount(userId) {
    if (this.testMode) {
      logger.info('TEST MODE: Would increment user note count', { userId });
      return { id: userId, notes_processed: 1, updated_at: new Date().toISOString() };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          notes_processed: this.supabase.sql`notes_processed + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error incrementing user note count:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();
