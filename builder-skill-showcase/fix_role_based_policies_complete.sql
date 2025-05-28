
-- Complete role-based policies for proper separation

-- Fix submissions policies
DROP POLICY IF EXISTS "Evaluators can view reviewed submissions" ON submissions;
DROP POLICY IF EXISTS "Participants can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Companies can view submissions for their challenges" ON submissions;
DROP POLICY IF EXISTS "Sponsors can view submissions for their challenges" ON submissions;

-- Participants can only see their own submissions
CREATE POLICY "Participants can view own submissions" ON submissions FOR SELECT USING (
  participant_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'participant'
    )
  )
);

-- Evaluators can only see reviewed submissions
CREATE POLICY "Evaluators can view reviewed submissions" ON submissions FOR SELECT USING (
  status = 'reviewed' AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'evaluator'
    )
  )
);

-- Sponsors can see submissions for their challenges
CREATE POLICY "Sponsors can view their challenge submissions" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM challenges c 
    JOIN user_roles ur ON ur.user_id = auth.uid() 
    WHERE c.id = challenge_id 
    AND c.company_id = auth.uid() 
    AND ur.role IN ('sponsor', 'company')
  )
);

-- Admins can see all submissions
CREATE POLICY "Admins can view all submissions" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Fix challenges policies
DROP POLICY IF EXISTS "Sponsors can create challenges" ON challenges;
DROP POLICY IF EXISTS "Sponsors can view their challenges" ON challenges;
DROP POLICY IF EXISTS "Sponsors can update their challenges" ON challenges;
DROP POLICY IF EXISTS "All authenticated can view challenges" ON challenges;

-- Everyone can view challenges (public visibility)
CREATE POLICY "Public can view challenges" ON challenges FOR SELECT USING (true);

-- Only sponsors, companies, and admins can create challenges
CREATE POLICY "Sponsors can create challenges" ON challenges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'company', 'admin')
  )
);

-- Only challenge owners and admins can update challenges
CREATE POLICY "Challenge owners can update" ON challenges FOR UPDATE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Fix scores policies
DROP POLICY IF EXISTS "Evaluators can manage their scores" ON scores;

-- Evaluators can manage scores for submissions they evaluate
CREATE POLICY "Evaluators can manage scores" ON scores FOR ALL USING (
  evaluator_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
    )
  )
);

-- Participants can view their own scores
CREATE POLICY "Participants can view their scores" ON scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id 
    AND s.participant_id = auth.uid()
  )
);

-- Sponsors can view scores for their challenges
CREATE POLICY "Sponsors can view challenge scores" ON scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s 
    JOIN challenges c ON c.id = s.challenge_id 
    WHERE s.id = submission_id 
    AND c.company_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'company')
    )
  )
);

-- Fix user_roles policies to prevent role escalation
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;

-- Users cannot insert their own roles (only during signup via trigger)
CREATE POLICY "Only system can insert roles" ON user_roles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Prevent role changes after creation
CREATE POLICY "Roles cannot be updated" ON user_roles FOR UPDATE USING (false);
CREATE POLICY "Roles cannot be deleted" ON user_roles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
