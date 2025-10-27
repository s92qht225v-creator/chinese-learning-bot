-- User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- User Review Queue Table
CREATE TABLE IF NOT EXISTS user_review_queue (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_vocabulary_id ON user_favorites(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_user_review_queue_user_id ON user_review_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_user_review_queue_vocabulary_id ON user_review_queue(vocabulary_id);

-- Comments
COMMENT ON TABLE user_favorites IS 'Stores user-specific favorite vocabulary words';
COMMENT ON TABLE user_review_queue IS 'Stores vocabulary words user wants to review via flashcards';
