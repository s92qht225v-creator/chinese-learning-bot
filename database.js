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
  }
};

module.exports = db;
