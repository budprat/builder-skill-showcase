-- Drop existing tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- Create badges table with proper structure
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  criteria JSONB DEFAULT '{}',
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table for the many-to-many relationship
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Insert sample badges
INSERT INTO badges (name, description, badge_type, criteria, icon_url) VALUES
(
  'First Steps',
  'Completed your first challenge submission',
  'first_submission',
  '{"event": "first_submission", "description": "Awarded when a user makes their first challenge submission"}',
  null
),
(
  'Sponsor Favorite',
  'Optimized Costs',
  'cost_optimizer',
  '{"event": "cost_optimizer", "description": "Awarded when a user makes Cost Optimization"}',
  null
),
(
  'Top 10%',
  'In Top 10% of Competors',
  'top_25',
  '{"event": "top_25", "description": "Awarded when a user is in Top 10% of Competors"}',
  null
),
(
  'Challenge Victor',
  'Won a coding challenge',
  'challenge_winner',
  '{"event": "challenge_win", "description": "Awarded when a user wins a challenge"}',
  null
),
(
  'Speed Demon',
  'Submitted a solution within 24 hours of challenge start',
  'speed_demon',
  '{"event": "fast_submission", "max_hours": 24, "description": "Awarded for quick submissions"}',
  null
),
(
  'Perfectionist',
  'Achieved a score of 90 or higher',
  'perfectionist',
  '{"event": "high_score", "min_score": 90, "description": "Awarded for exceptional performance"}',
  null
),
(
  'Team Player',
  'Participated in 5 or more challenges',
  'team_player',
  '{"event": "multiple_challenges", "min_challenges": 5, "description": "Awarded for consistent participation"}',
  null
),
(
  'Code Explorer',
  'Submitted solutions in 3 different domains',
  'domain_explorer',
  '{"event": "multiple_domains", "min_domains": 3, "description": "Awarded for exploring different challenge domains"}',
  null
),
(
  'Rising Star',
  'Achieved top 3 ranking in a challenge',
  'rising_star',
  '{"event": "top_ranking", "max_rank": 3, "description": "Awarded for achieving top rankings"}',
  null
);

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for badges (everyone can read badges)
CREATE POLICY "Everyone can read badges" ON badges FOR SELECT USING (true);

-- Create policies for user_badges (users can only see their own badges)
CREATE POLICY "Users can read their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);