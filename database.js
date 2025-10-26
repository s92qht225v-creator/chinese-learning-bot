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
  async getVocabulary(hskLevel = null) {
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

  // ========== ADMIN METHODS ==========

  // Add vocabulary
  async addVocabulary(word) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('vocabulary')
      .insert({
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        hsk_level: word.hsk_level || 1,
        difficulty: word.difficulty || 'beginner'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding vocabulary:', error);
      throw error;
    }

    return data;
  },

  // Update vocabulary
  async updateVocabulary(id, word) {
    if (!supabase) return null;

    const updates = {};
    if (word.chinese) updates.chinese = word.chinese;
    if (word.pinyin) updates.pinyin = word.pinyin;
    if (word.english) updates.english = word.english;
    if (word.hsk_level) updates.hsk_level = word.hsk_level;
    if (word.difficulty) updates.difficulty = word.difficulty;

    const { data, error } = await supabase
      .from('vocabulary')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vocabulary:', error);
      throw error;
    }

    return data;
  },

  // Delete vocabulary
  async deleteVocabulary(id) {
    if (!supabase) return null;

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vocabulary:', error);
      throw error;
    }

    return { success: true };
  },

  // Get all users
  async getAllUsers() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data;
  },

  // Get admin statistics
  async getAdminStats() {
    if (!supabase) {
      return {
        totalUsers: 0,
        totalVocabulary: 0,
        totalQuizzes: 0,
        activeToday: 0
      };
    }

    // Get counts from database
    const [usersResult, vocabResult, progressResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('vocabulary').select('id', { count: 'exact', head: true }),
      supabase.from('user_progress').select('id', { count: 'exact', head: true })
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalVocabulary: vocabResult.count || 0,
      totalQuizzes: progressResult.count || 0,
      activeToday: usersResult.count || 0 // TODO: Filter by today's activity
    };
  }
};

module.exports = db;
