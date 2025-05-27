
-- Insert sample badges into the badges table

INSERT INTO badges (id, name, description, badge_type, criteria, icon_url) VALUES
(
  gen_random_uuid(),
  'First Steps',
  'Completed your first challenge submission',
  'first_submission',
  '{"event": "first_submission", "description": "Awarded when a user makes their first challenge submission"}',
  null
),
(
  gen_random_uuid(),
  'Challenge Victor',
  'Won a coding challenge',
  'challenge_winner',
  '{"event": "challenge_win", "description": "Awarded when a user wins a challenge"}',
  null
),
(
  gen_random_uuid(),
  'Speed Demon',
  'Submitted a solution within 24 hours of challenge start',
  'speed_demon',
  '{"event": "fast_submission", "max_hours": 24, "description": "Awarded for quick submissions"}',
  null
),
(
  gen_random_uuid(),
  'Perfectionist',
  'Achieved a score of 90 or higher',
  'perfectionist',
  '{"event": "high_score", "min_score": 90, "description": "Awarded for exceptional performance"}',
  null
),
(
  gen_random_uuid(),
  'Team Player',
  'Participated in 5 or more challenges',
  'team_player',
  '{"event": "multiple_challenges", "min_challenges": 5, "description": "Awarded for consistent participation"}',
  null
),
(
  gen_random_uuid(),
  'Code Explorer',
  'Submitted solutions in 3 different domains',
  'domain_explorer',
  '{"event": "multiple_domains", "min_domains": 3, "description": "Awarded for exploring different challenge domains"}',
  null
),
(
  gen_random_uuid(),
  'Rising Star',
  'Achieved top 3 ranking in a challenge',
  'rising_star',
  '{"event": "top_ranking", "max_rank": 3, "description": "Awarded for achieving top rankings"}',
  null
)
ON CONFLICT (id) DO NOTHING;
