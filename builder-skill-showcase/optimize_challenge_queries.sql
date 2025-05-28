
-- Optimize challenge queries with proper indexes
-- This will significantly speed up filtering operations

-- Index for status filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- Index for company_id filtering (sponsor dashboard)
CREATE INDEX IF NOT EXISTS idx_challenges_company_id ON challenges(company_id);

-- Composite index for status and created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_challenges_status_created_at ON challenges(status, created_at DESC);

-- Index for submission_deadline filtering and sorting
CREATE INDEX IF NOT EXISTS idx_challenges_deadline ON challenges(submission_deadline);

-- Index for domains filtering (using GIN for array operations)
CREATE INDEX IF NOT EXISTS idx_challenges_domains ON challenges USING GIN(domains);

-- Index for company_name filtering (text search)
CREATE INDEX IF NOT EXISTS idx_challenges_company_name ON challenges(company_name);

-- Index for title filtering (text search)
CREATE INDEX IF NOT EXISTS idx_challenges_title ON challenges(title);

-- Optimize user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Composite index for user role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Update table statistics for better query planning
ANALYZE challenges;
ANALYZE user_roles;
