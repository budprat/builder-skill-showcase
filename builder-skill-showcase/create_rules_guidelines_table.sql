
-- Create rules_guidelines table
CREATE TABLE rules_guidelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'participation', 'submission', 'technical', 'judging', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_rules_guidelines_challenge_id ON rules_guidelines(challenge_id);
CREATE INDEX idx_rules_guidelines_rule_type ON rules_guidelines(rule_type);

-- Insert default rules for existing challenges
INSERT INTO rules_guidelines (challenge_id, rule_type, title, description, is_mandatory, order_index)
SELECT 
  c.id,
  'participation',
  'Solo/Team Participation',
  'Solo participants or teams with maximum 5 members are allowed',
  true,
  1
FROM challenges c;

INSERT INTO rules_guidelines (challenge_id, rule_type, title, description, is_mandatory, order_index)
SELECT 
  c.id,
  'submission',
  'Original Work Required',
  'All submissions must be original work created specifically for this challenge',
  true,
  2
FROM challenges c;

INSERT INTO rules_guidelines (challenge_id, rule_type, title, description, is_mandatory, order_index)
SELECT 
  c.id,
  'technical',
  'Code Accessibility',
  'Code must be publicly accessible via GitHub or similar platform',
  true,
  3
FROM challenges c;

INSERT INTO rules_guidelines (challenge_id, rule_type, title, description, is_mandatory, order_index)
SELECT 
  c.id,
  'submission',
  'Deadline Compliance',
  'All deliverables must be submitted by the specified deadline',
  true,
  4
FROM challenges c;

INSERT INTO rules_guidelines (challenge_id, rule_type, title, description, is_mandatory, order_index)
SELECT 
  c.id,
  'judging',
  'Judging Period',
  'Judging period: 1-2 weeks after submission deadline',
  false,
  5
FROM challenges c;

-- Add RLS policies
ALTER TABLE rules_guidelines ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to rules_guidelines" ON rules_guidelines
  FOR SELECT TO authenticated
  USING (true);

-- Allow insert/update/delete for admins only
CREATE POLICY "Allow admin full access to rules_guidelines" ON rules_guidelines
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
