-- Create lesson_progress table to track user lesson completion
CREATE TABLE IF NOT EXISTS lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  lesson_id BIGINT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate entries
  UNIQUE(user_id, lesson_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own progress
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
  FOR SELECT USING (true);

-- Policy to allow users to insert their own progress
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress
  FOR INSERT WITH CHECK (true);

-- Policy to allow users to update their own progress
CREATE POLICY "Users can update own lesson progress" ON lesson_progress
  FOR UPDATE USING (true);
