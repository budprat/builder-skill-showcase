
-- Comprehensive security fixes for the platform

-- 1. Strengthen user_roles policies to prevent privilege escalation
DROP POLICY IF EXISTS "Only system can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;

-- Prevent users from inserting their own roles except during signup
CREATE POLICY "Only admins can insert roles" ON user_roles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR 
  -- Allow during initial signup (no existing roles)
  NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = NEW.user_id
  )
);

-- 2. Add audit trail table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 3. Strengthen submissions policies to prevent data leakage
DROP POLICY IF EXISTS "Participants can view own submissions" ON submissions;
CREATE POLICY "Participants can view own submissions" ON submissions FOR SELECT USING (
  participant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 4. Add rate limiting table for file uploads
CREATE TABLE IF NOT EXISTS upload_rate_limit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE upload_rate_limit ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit data
CREATE POLICY "Users can view own rate limits" ON upload_rate_limit FOR SELECT USING (
  user_id = auth.uid()
);

-- 5. Add file metadata table for better security tracking
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'malicious', 'error')),
  scan_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Users can view files they uploaded, admins can view all
CREATE POLICY "Users can view own files" ON file_metadata FOR SELECT USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 6. Create function to validate URLs
CREATE OR REPLACE FUNCTION is_valid_url(url_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic URL validation
  RETURN url_text ~ '^https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(/.*)?$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Add constraints to profiles table for data validation
ALTER TABLE profiles ADD CONSTRAINT valid_github_url 
  CHECK (github_url IS NULL OR github_url ~ '^https://github\.com/[a-zA-Z0-9-]+/?$');

ALTER TABLE profiles ADD CONSTRAINT valid_linkedin_url 
  CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https://linkedin\.com/in/[a-zA-Z0-9-]+/?$');

ALTER TABLE profiles ADD CONSTRAINT valid_portfolio_url 
  CHECK (portfolio_url IS NULL OR is_valid_url(portfolio_url));

ALTER TABLE profiles ADD CONSTRAINT bio_length_limit 
  CHECK (char_length(bio) <= 500);

ALTER TABLE profiles ADD CONSTRAINT full_name_length_limit 
  CHECK (char_length(full_name) <= 100);

-- 8. Strengthen challenge creation policies
DROP POLICY IF EXISTS "Sponsors can create challenges" ON challenges;
CREATE POLICY "Authorized users can create challenges" ON challenges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'sponsor', 'company')
  )
);

-- 9. Add session timeout tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (
  user_id = auth.uid()
);

-- 10. Create function to log sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
