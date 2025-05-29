
-- Debug challenge filtering issues
-- Check all challenges and their ownership

SELECT 
  c.id,
  c.title,
  c.company_name,
  c.company_id,
  c.status,
  c.created_at,
  ur.user_id as role_user_id,
  ur.role as user_role,
  au.email as user_email
FROM challenges c
LEFT JOIN user_roles ur ON c.company_id = ur.user_id
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON ur.user_id = p.id
ORDER BY c.created_at DESC;

-- Check specific user's challenges
-- Replace 'USER_ID_HERE' with actual user ID
/*
SELECT 
  c.*,
  ur.role
FROM challenges c
JOIN user_roles ur ON c.company_id = ur.user_id
WHERE c.company_id = 'USER_ID_HERE';
*/

-- Check for challenges without proper company_id
SELECT 
  id,
  title,
  company_name,
  company_id,
  status
FROM challenges 
WHERE company_id IS NULL;

-- Check user roles
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  COUNT(c.id) as challenge_count
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN challenges c ON ur.user_id = c.company_id
WHERE ur.role IN ('sponsor', 'company')
GROUP BY ur.user_id, ur.role, au.email
ORDER BY challenge_count DESC;
