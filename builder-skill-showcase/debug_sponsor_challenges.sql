
-- Debug query to check challenge ownership and potential issues
-- Run this to see all challenges and their company_id relationships

SELECT 
  c.id as challenge_id,
  c.title,
  c.company_id,
  c.company_name,
  c.status,
  c.created_at,
  ur.user_id as role_user_id,
  ur.role as user_role,
  au.email as user_email
FROM challenges c
LEFT JOIN user_roles ur ON c.company_id = ur.user_id
LEFT JOIN auth.users au ON c.company_id = au.id
ORDER BY c.created_at DESC;

-- Check for any challenges with missing or invalid company_id
SELECT 
  id,
  title,
  company_id,
  company_name,
  'Missing company_id' as issue
FROM challenges 
WHERE company_id IS NULL;

-- Check for any challenges where company_id doesn't match a valid user
SELECT 
  c.id,
  c.title,
  c.company_id,
  c.company_name,
  'Invalid company_id - no matching user' as issue
FROM challenges c
LEFT JOIN auth.users au ON c.company_id = au.id
WHERE au.id IS NULL AND c.company_id IS NOT NULL;

-- Check user roles for sponsors
SELECT 
  ur.user_id,
  ur.role,
  au.email,
  COUNT(c.id) as challenge_count
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN challenges c ON c.company_id = ur.user_id
WHERE ur.role IN ('sponsor', 'company')
GROUP BY ur.user_id, ur.role, au.email
ORDER BY challenge_count DESC;
