-- Add speaker and lesson_id columns to dialogues table
ALTER TABLE dialogues 
ADD COLUMN IF NOT EXISTS speaker VARCHAR(100),
ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE;

-- Create index for lesson_id for faster queries
CREATE INDEX IF NOT EXISTS idx_dialogues_lesson_id ON dialogues(lesson_id);

-- Create index for dialogue_order within lessons
CREATE INDEX IF NOT EXISTS idx_dialogues_order ON dialogues(dialogue_order);
