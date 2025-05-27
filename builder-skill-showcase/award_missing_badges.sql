-- Script to award missing "First Steps" badges to users who have submitted but don't have the badge

-- First, let's see who has submissions but no "First Steps" badge
WITH users_with_submissions AS (
  SELECT DISTINCT s.participant_id as user_id
  FROM submissions s
  WHERE s.participant_id IS NOT NULL
),
users_with_first_badge AS (
  SELECT DISTINCT ub.user_id
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE b.badge_type = 'first_submission'
),
users_missing_badge AS (
  SELECT uws.user_id
  FROM users_with_submissions uws
  LEFT JOIN users_with_first_badge uwfb ON uws.user_id = uwfb.user_id
  WHERE uwfb.user_id IS NULL
)
-- Award the "First Steps" badge to users who are missing it
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  umb.user_id,
  b.id as badge_id,
  NOW() as earned_at
FROM users_missing_badge umb
CROSS JOIN badges b
WHERE b.badge_type = 'first_submission'
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub2 
    WHERE ub2.user_id = umb.user_id 
    AND ub2.badge_id = b.id
  );

-- Show the results
SELECT 
  p.username,
  COUNT(s.id) as submission_count,
  CASE 
    WHEN ub.id IS NOT NULL THEN 'Has Badge'
    ELSE 'Missing Badge'
  END as badge_status
FROM profiles p
LEFT JOIN submissions s ON p.id = s.participant_id
LEFT JOIN user_badges ub ON p.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id AND b.badge_type = 'first_submission'
WHERE p.username = 'Pbudhwar' OR s.id IS NOT NULL
GROUP BY p.id, p.username, ub.id
ORDER BY submission_count DESC;