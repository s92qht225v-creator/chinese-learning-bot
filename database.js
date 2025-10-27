const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
let supabase = null;

if (config.supabase.url && config.supabase.serviceKey) {
  supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey
  );
}

// Database operations
const db = {
  // Check if database is configured
  isConfigured() {
    return supabase !== null;
  },

  // Get or create user
  async getOrCreateUser(telegramUser) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
      }, {
        onConflict: 'telegram_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  },

  // Get all vocabulary
  async getVocabulary(hskLevel = null, lessonId = null) {
    if (!supabase) {
      // Fallback to hardcoded data
      return require('./vocabulary-data');
    }

    let query = supabase
      .from('vocabulary')
      .select('*')
      .order('id');

    if (hskLevel) {
      query = query.eq('hsk_level', hskLevel);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vocabulary:', error);
      return require('./vocabulary-data');
    }

    return data;
  },

  // Get user progress
  async getUserProgress(telegramId) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        vocabulary (*)
      `)
      .eq('user_id', telegramId);

    if (error) {
      console.error('Error fetching progress:', error);
      return null;
    }

    return data;
  },

  // Update user progress
  async updateProgress(telegramId, vocabularyId, correct) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: telegramId,
        vocabulary_id: vocabularyId,
        last_reviewed: new Date().toISOString(),
        correct_count: supabase.raw(correct ? 'correct_count + 1' : 'correct_count'),
        incorrect_count: supabase.raw(correct ? 'incorrect_count' : 'incorrect_count + 1'),
        mastery_level: supabase.raw(correct ? 'LEAST(mastery_level + 1, 5)' : 'GREATEST(mastery_level - 1, 0)')
      }, {
        onConflict: 'user_id,vocabulary_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return null;
    }

    return data;
  },

  // Get user stats
  async getUserStats(telegramId) {
    if (!supabase) return { wordsLearned: 0, streak: 0, accuracy: 0 };

    const { data, error } = await supabase
      .from('user_progress')
      .select('correct_count, incorrect_count')
      .eq('user_id', telegramId);

    if (error || !data) {
      return { wordsLearned: 0, streak: 0, accuracy: 0 };
    }

    const totalCorrect = data.reduce((sum, item) => sum + item.correct_count, 0);
    const totalIncorrect = data.reduce((sum, item) => sum + item.incorrect_count, 0);
    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

    return {
      wordsLearned: data.length,
      streak: 0, // TODO: Calculate from activity log
      accuracy
    };
  },

  // ========== LESSONS ==========
  async getLessons(hskLevel = null) {
    if (!supabase) {
      console.warn('[DB] Supabase not configured, returning empty lessons array');
      return [];
    }
    
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('hsk_level', { ascending: true })
        .order('lesson_number', { ascending: true });
      
      if (hskLevel) {
        query = query.eq('hsk_level', hskLevel);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[DB] Error fetching lessons:', error);
        return [];
      }
      
      console.log(`[DB] Retrieved ${data ? data.length : 0} lessons for HSK ${hskLevel || 'all'}`);
      return data || [];
    } catch (err) {
      console.error('[DB] Exception in getLessons:', err);
      return [];
    }
  },

  async getLesson(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async addLesson(lesson) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('lessons')
      .insert([lesson])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLesson(id, lesson) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('lessons')
      .update(lesson)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLesson(id) {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ========== DIALOGUES ==========
  async getDialogues(options = {}) {
    if (!supabase) return [];
    
    let query = supabase
      .from('dialogues')
      .select(`
        *,
        lessons (id, title, hsk_level, lesson_number)
      `);
    
    // Search filter
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,chinese.ilike.%${options.search}%`);
    }
    
    // Lesson filter
    if (options.lessonId) {
      query = query.eq('lesson_id', options.lessonId);
    }
    
    // Visibility filter
    if (options.visible !== undefined) {
      query = query.eq('visible', options.visible);
    }
    
    query = query.order('dialogue_order', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getDialogue(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('dialogues')
      .select(`
        *,
        lessons (id, title, hsk_level, lesson_number)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async addDialogue(dialogue) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('dialogues')
      .insert([dialogue])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDialogue(id, dialogue) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('dialogues')
      .update(dialogue)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDialogue(id) {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from('dialogues')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async bulkUpdateDialogues(ids, updates) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('dialogues')
      .update(updates)
      .in('id', ids)
      .select();
    if (error) throw error;
    return data;
  },

  async getDialoguesByLesson(lessonId) {
    if (!supabase) return [];
    try {
      // Get dialogues for the lesson
      const { data: dialogues, error: dialogueError } = await supabase
        .from('dialogues')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('visible', true)
        .order('display_order', { ascending: true });

      if (dialogueError) {
        console.error('[DB] Error fetching dialogues:', dialogueError);
        return [];
      }

      if (!dialogues || dialogues.length === 0) {
        return [];
      }

      // Get all dialogue lines for each dialogue
      for (let dialogue of dialogues) {
        const { data: lines, error: linesError } = await supabase
          .from('dialogue_lines')
          .select('*')
          .eq('dialogue_id', dialogue.id)
          .order('line_order', { ascending: true });

        if (linesError) {
          console.error('[DB] Error fetching dialogue lines:', linesError);
          dialogue.lines = [];
        } else {
          dialogue.lines = lines || [];
        }
      }

      return dialogues;
    } catch (err) {
      console.error('[DB] Exception in getDialoguesByLesson:', err);
      return [];
    }
  },

  // ========== GRAMMAR ==========
  async getGrammar() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('grammar_points')
      .select(`
        *,
        lessons (id, title, hsk_level, lesson_number)
      `)
      .order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addGrammar(grammar) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('grammar_points')
      .insert([grammar])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGrammar(id, grammar) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('grammar_points')
      .update(grammar)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGrammar(id) {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from('grammar_points')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ========== QUIZZES ==========
  async getQuizzes() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        lessons (id, title, hsk_level, lesson_number)
      `)
      .order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addQuiz(quiz) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quiz])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuiz(id, quiz) {
    if (!supabase) throw new Error('Database not configured');
    const { data, error} = await supabase
      .from('quizzes')
      .update(quiz)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteQuiz(id) {
    if (!supabase) throw new Error('Database not configured');
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

module.exports = db;
// Export a getter for supabase to ensure it's initialized
Object.defineProperty(module.exports, 'supabase', {
  get: function() { return supabase; }
});
