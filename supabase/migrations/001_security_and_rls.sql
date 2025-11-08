-- =====================================================
-- Security Migration: RLS Policies and Profile Auto-Creation
-- =====================================================
-- This migration implements:
-- 1. Row Level Security (RLS) policies for all tables
-- 2. Automatic profile creation trigger
-- 3. Security best practices
-- =====================================================

-- =====================================================
-- SECTION 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 2: Profiles Table RLS Policies
-- =====================================================

-- Users can view any profile
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 3: Challenges Table RLS Policies
-- =====================================================

-- Everyone can view active challenges
CREATE POLICY "Active challenges are viewable by everyone"
  ON challenges FOR SELECT
  USING (status IN ('active', 'judging', 'completed'));

-- Admins and companies can view all challenges (including drafts)
CREATE POLICY "Admins and companies can view all challenges"
  ON challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company')
    )
  );

-- Only admins and companies can create challenges
CREATE POLICY "Admins and companies can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'company')
    )
  );

-- Admins and company owners can update their challenges
CREATE POLICY "Admins and company owners can update challenges"
  ON challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
    OR
    (
      auth.uid() = company_id AND
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'company'
      )
    )
  );

-- Only admins can delete challenges
CREATE POLICY "Only admins can delete challenges"
  ON challenges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 4: Submissions Table RLS Policies
-- =====================================================

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = participant_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Company owners can view submissions for their challenges
CREATE POLICY "Companies can view submissions for their challenges"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      INNER JOIN user_roles ur ON ur.user_id = c.company_id
      WHERE c.id = submissions.challenge_id
      AND c.company_id = auth.uid()
      AND ur.role = 'company'
    )
  );

-- Participants can create submissions
CREATE POLICY "Participants can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (
    auth.uid() = participant_id AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'participant'
    )
  );

-- Participants can update their own submissions
CREATE POLICY "Participants can update own submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = participant_id)
  WITH CHECK (auth.uid() = participant_id);

-- Admins can update any submission (for scoring)
CREATE POLICY "Admins can update submissions for scoring"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete submissions
CREATE POLICY "Only admins can delete submissions"
  ON submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 5: User Roles Table RLS Policies
-- =====================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 6: User Files Table RLS Policies
-- =====================================================

-- Users can view their own files
CREATE POLICY "Users can view own files"
  ON user_files FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all files
CREATE POLICY "Admins can view all files"
  ON user_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Users can upload their own files
CREATE POLICY "Users can upload own files"
  ON user_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON user_files FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SECTION 7: Notifications Table RLS Policies
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/admins can create notifications for any user
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 8: Badges and User Badges RLS Policies
-- =====================================================

-- Everyone can view badges
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);

-- Only admins can manage badges
CREATE POLICY "Only admins can manage badges"
  ON badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view all user badges (for leaderboard)
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Only admins can award badges
CREATE POLICY "Only admins can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- SECTION 9: Auto-Create Profile on User Signup
-- =====================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );

  -- Assign participant role by default
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'participant', NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SECTION 10: Helper Functions
-- =====================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 11: Grant Permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- To apply this migration:
-- 1. Save this file in supabase/migrations/
-- 2. Run: supabase db push
-- OR
-- 3. Execute manually in Supabase SQL Editor
