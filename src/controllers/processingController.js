const openaiService = require('../services/openaiService');
const supabaseService = require('../services/supabaseService');
const logger = require('../utils/logger');

class ProcessingController {
  /**
   * Process a note with OpenAI
   * POST /api/process
   */
  async processNote(req, res) {
    const startTime = Date.now();
    
    try {
      const { noteId } = req.body;

      // Validate request
      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: 'Note ID is required',
          error: 'MISSING_NOTE_ID'
        });
      }

      logger.logProcessing('Starting note processing', { noteId });

      // Get note from Supabase
      const note = await supabaseService.getNoteById(noteId);
      
      if (!note) {
        logger.warn('Note not found for processing', { noteId });
        return res.status(404).json({
          success: false,
          message: 'Note not found',
          error: 'NOTE_NOT_FOUND'
        });
      }

      // Check if note is already processed
      if (note.processing_status === 'completed') {
        logger.info('Note already processed', { 
          noteId, 
          status: note.processing_status 
        });
        return res.json({
          success: true,
          message: 'Note already processed',
          data: {
            noteId,
            processedText: note.processed_text,
            tokensUsed: note.tokens_used,
            processingTime: note.processing_time,
            alreadyProcessed: true
          }
        });
      }

      // Check user limits before processing
      const userLimits = await supabaseService.checkUserLimits(note.user_id);
      
      if (userLimits.limit_reached) {
        logger.warn('User processing limit reached', { 
          userId: note.user_id, 
          noteId,
          monthlyCount: userLimits.monthly_note_count 
        });
        
        await supabaseService.updateNoteProcessing(noteId, {
          status: 'failed',
          processedText: note.original_text + '\n\n**Note: Monthly processing limit reached. Please upgrade to premium.**'
        });

        return res.status(429).json({
          success: false,
          message: 'Monthly processing limit reached',
          error: 'LIMIT_REACHED',
          data: {
            monthlyCount: userLimits.monthly_note_count,
            notesRemaining: userLimits.notes_remaining,
            subscriptionTier: userLimits.subscription_tier
          }
        });
      }

      // Update status to processing
      await supabaseService.updateNoteProcessing(noteId, {
        status: 'processing'
      });

      logger.logProcessing('Processing note with OpenAI', { 
        noteId, 
        noteType: note.note_type,
        textLength: note.original_text.length 
      });

      // Process with OpenAI
      const result = await openaiService.processNote(
        note.original_text, 
        note.note_type
      );

      // Update note with results
      const updatedNote = await supabaseService.updateNoteProcessing(noteId, {
        processedText: result.processedText,
        status: result.success ? 'completed' : 'failed',
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime
      });

      // Increment user's note count only if processing was successful
      if (result.success) {
        await supabaseService.incrementUserNoteCount(note.user_id);
      }

      const totalTime = Date.now() - startTime;

      logger.logProcessing('Note processing completed', { 
        noteId, 
        success: result.success,
        tokensUsed: result.tokensUsed,
        totalTime: `${totalTime}ms`
      });

      res.json({
        success: true,
        message: result.success ? 'Note processed successfully' : 'Note processing completed with fallback',
        data: {
          noteId,
          originalText: note.original_text,
          processedText: result.processedText,
          noteType: note.note_type,
          processingStatus: result.success ? 'completed' : 'failed',
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
          totalTime: totalTime,
          openaiSuccess: result.success,
          model: result.model || 'fallback'
        }
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      logger.logError(error, { 
        action: 'processNote', 
        noteId: req.body.noteId,
        totalTime: `${totalTime}ms`
      });

      // Try to update note status to failed
      if (req.body.noteId) {
        try {
          await supabaseService.updateNoteProcessing(req.body.noteId, {
            status: 'failed'
          });
        } catch (updateError) {
          logger.logError(updateError, { 
            action: 'updateFailedStatus', 
            noteId: req.body.noteId 
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Processing failed',
        error: 'PROCESSING_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get processing status
   * GET /api/status/:noteId
   */
  async getProcessingStatus(req, res) {
    try {
      const { noteId } = req.params;

      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: 'Note ID is required'
        });
      }

      const note = await supabaseService.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      res.json({
        success: true,
        data: {
          noteId,
          processingStatus: note.processing_status,
          tokensUsed: note.tokens_used,
          processingTime: note.processing_time,
          hasProcessedText: !!note.processed_text,
          createdAt: note.created_at,
          updatedAt: note.updated_at
        }
      });

    } catch (error) {
      logger.logError(error, { action: 'getProcessingStatus', noteId: req.params.noteId });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get processing status',
        error: 'STATUS_ERROR'
      });
    }
  }

  /**
   * Get processing statistics
   * GET /api/stats
   */
  async getStats(req, res) {
    try {
      const [supabaseStats, openaiHealth] = await Promise.all([
        supabaseService.getProcessingStats(),
        openaiService.getServiceHealth()
      ]);

      res.json({
        success: true,
        data: {
          database: supabaseStats,
          openai: openaiHealth,
          server: {
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            nodeVersion: process.version,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      logger.logError(error, { action: 'getStats' });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: 'STATS_ERROR'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/health
   */
  async healthCheck(req, res) {
    try {
      const [supabaseHealth, openaiHealth] = await Promise.all([
        supabaseService.getServiceHealth(),
        openaiService.getServiceHealth()
      ]);

      const overallHealth = supabaseHealth.status === 'healthy' && openaiHealth.status === 'healthy';

      res.status(overallHealth ? 200 : 503).json({
        success: overallHealth,
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          supabase: supabaseHealth,
          openai: openaiHealth
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: process.env.NODE_ENV
        }
      });

    } catch (error) {
      logger.logError(error, { action: 'healthCheck' });
      
      res.status(503).json({
        success: false,
        status: 'error',
        message: 'Health check failed',
        error: 'HEALTH_CHECK_ERROR'
      });
    }
  }
}

module.exports = new ProcessingController();
