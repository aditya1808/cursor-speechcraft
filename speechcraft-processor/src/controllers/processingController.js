const Joi = require('joi');
const logger = require('../utils/logger');
const openaiService = require('../services/openaiService');
const supabaseService = require('../services/supabaseService');

const processNoteSchema = Joi.object({
  noteId: Joi.string().uuid().required(),
  noteType: Joi.string().valid('meeting', 'todo', 'idea', 'general').default('general')
});

class ProcessingController {
  async processNote(req, res) {
    try {
      // Validate request
      const { error, value } = processNoteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.details[0].message
        });
      }

      const { noteId, noteType } = value;

      logger.info('Processing note request', { noteId, noteType });

      // Fetch note from Supabase
      const note = await supabaseService.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Note not found'
        });
      }

      if (note.processing_status === 'completed') {
        return res.status(400).json({
          error: 'Already processed',
          message: 'This note has already been processed'
        });
      }

      // Update status to processing
      await supabaseService.updateNoteProcessing(noteId, {
        processing_status: 'processing',
        note_type: noteType
      });

      // Process with OpenAI
      const result = await openaiService.processNote(note.original_text, noteType);

      // Update note with results
      const updatedNote = await supabaseService.updateNoteProcessing(noteId, {
        processed_text: result.processedText,
        processing_status: result.error ? 'failed' : 'completed',
        tokens_used: result.tokensUsed,
        processing_time: result.processingTime,
        note_type: noteType
      });

      // Increment user's note count
      await supabaseService.incrementUserNoteCount(note.user_id);

      logger.info('Note processing completed', { 
        noteId, 
        noteType,
        success: !result.error,
        tokensUsed: result.tokensUsed 
      });

      res.status(200).json({
        success: true,
        note: updatedNote,
        processing: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
          error: result.error || null
        }
      });

    } catch (error) {
      logger.error('Processing controller error:', error);
      
      // Try to update note status to failed
      if (req.body.noteId) {
        try {
          await supabaseService.updateNoteProcessing(req.body.noteId, {
            processing_status: 'failed'
          });
        } catch (updateError) {
          logger.error('Failed to update note status to failed:', updateError);
        }
      }

      res.status(500).json({
        error: 'Processing failed',
        message: 'An error occurred while processing the note'
      });
    }
  }
}

module.exports = new ProcessingController();
