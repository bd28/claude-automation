---
name: rls-security-patterns
version: 1.0.0
description: Automatically add Row Level Security policies to new database tables
category: security
tags: [security, rls, postgres, supabase, authorization]
applies_to: [schema-wizard, feature-builder]
trigger: when_creating_tables
priority: critical
---

# RLS Security Patterns Skill

## Purpose

Automatically implement Row Level Security (RLS) policies for all new database tables to prevent unauthorized data access. RLS is the first line of defense against data breaches in Supabase applications.

## When to Apply This Skill

Apply this skill **ALWAYS** when:
- Creating new tables
- Adding user-facing data
- Storing multi-tenant data
- Creating tables with user relationships

**NEVER skip RLS** - even for "internal" tables. Security by default is critical.

Exceptions (rare):
- Lookup/reference tables with truly public data
- Internal admin tables with no user access

## How to Apply This Skill

### 1. Enable RLS on Every Table

Always enable RLS when creating tables:

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (CRITICAL - never skip this!)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

### 2. Create Policies for Common Patterns

#### Pattern A: User Owns Record (Most Common)

Users can only access their own records:

```sql
-- Users can view their own posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own posts
CREATE POLICY "Users can create own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

#### Pattern B: Public Read, Owner Write

Anyone can read, only owner can modify:

```sql
-- Anyone can view published posts
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
TO authenticated
USING (published = true);

-- Users can view their own unpublished posts
CREATE POLICY "Users can view own unpublished posts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND published = false);

-- Users can modify their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

#### Pattern C: Multi-Tenant (Organization-Based)

Users can only access data in their organization:

```sql
-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organization members can view org data
CREATE POLICY "Organization members can view projects"
ON projects FOR SELECT
TO authenticated
USING (organization_id = auth.user_organization_id());

-- Organization members can create projects
CREATE POLICY "Organization members can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (organization_id = auth.user_organization_id());
```

#### Pattern D: Role-Based Access

Different permissions based on user roles:

```sql
-- Helper function to get user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON posts FOR SELECT
TO authenticated
USING (auth.user_role() = 'admin');

-- Regular users can view published posts
CREATE POLICY "Users can view published posts"
ON posts FOR SELECT
TO authenticated
USING (published = true AND auth.user_role() = 'user');

-- Moderators can update any post
CREATE POLICY "Moderators can update posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.user_role() IN ('admin', 'moderator'));
```

### 3. Use SECURITY DEFINER for Helper Functions

Helper functions should use `SECURITY DEFINER` to access auth context safely:

```sql
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles
  WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 4. Test RLS Policies

Always test policies by:
1. Creating test data as different users
2. Attempting unauthorized access
3. Verifying policies enforce expected restrictions

```sql
-- Test as user 1
SET request.jwt.claim.sub = 'user-1-uuid';
SELECT * FROM posts; -- Should only see user 1's posts

-- Test as user 2
SET request.jwt.claim.sub = 'user-2-uuid';
SELECT * FROM posts; -- Should only see user 2's posts
```

### 5. Document Policy Rationale

Add comments explaining the security model:

```sql
-- Security Model:
-- - Users can only view/modify their own posts
-- - Published posts are visible to all authenticated users
-- - Admins have full access to all posts

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own posts" ...
```

## Examples

### Good Examples

#### User-Owned Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (public read)
CREATE POLICY "Anyone can view profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can create own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users cannot delete their profile (handled by CASCADE)
-- No DELETE policy = no one can delete
```

#### Multi-Tenant Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Helper function for organization membership
CREATE OR REPLACE FUNCTION auth.is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organization members can view projects
CREATE POLICY "Organization members can view projects"
ON projects FOR SELECT
TO authenticated
USING (auth.is_organization_member(organization_id));

-- Organization members can create projects
CREATE POLICY "Organization members can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_organization_member(organization_id)
  AND auth.uid() = created_by
);

-- Project creators can update their projects
CREATE POLICY "Creators can update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  AND auth.is_organization_member(organization_id)
);
```

#### Public Read, Selective Write
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published posts (even unauthenticated)
CREATE POLICY "Anyone can view published posts"
ON blog_posts FOR SELECT
TO anon, authenticated
USING (published = true);

-- Authors can view their own drafts
CREATE POLICY "Authors can view own drafts"
ON blog_posts FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- Authors can create posts
CREATE POLICY "Authors can create posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
ON blog_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
```

### Bad Examples

```sql
-- ❌ CRITICAL: RLS not enabled - NEVER do this!
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  content TEXT
);
-- Missing: ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ❌ Overly permissive policy
CREATE POLICY "Anyone can do anything"
ON posts FOR ALL
TO authenticated
USING (true);  -- Allows anyone to view/modify all data!

-- ❌ Missing WITH CHECK on INSERT/UPDATE
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
USING (auth.uid() = user_id);
-- Should use WITH CHECK, not USING for INSERT

-- ❌ Policy doesn't match intent
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (true)  -- Allows updating ANY post!
WITH CHECK (auth.uid() = user_id);  -- Only checks new values

-- ❌ Missing authentication check
CREATE POLICY "View posts"
ON posts FOR SELECT
USING (true);  -- Applies to ALL roles including anon!
-- Should specify: TO authenticated
```

## Integration Points

This skill is automatically applied by:
- **schema-wizard agent** - When creating tables (step 3)
- **feature-builder agent** - When database schema changes (step 3)
- **code-reviewer agent** - Validates RLS policies exist and are correct

## Checklist

When applying this skill, verify:
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is present
- [ ] Policies exist for SELECT, INSERT, UPDATE, DELETE (as needed)
- [ ] Policies use `TO authenticated` (or specific roles)
- [ ] INSERT/UPDATE policies use `WITH CHECK` clause
- [ ] Policies enforce the intended security model
- [ ] Helper functions use `SECURITY DEFINER`
- [ ] Policies are tested with different users
- [ ] Security model is documented in comments

## Common Gotchas

### 1. Using USING instead of WITH CHECK
```sql
-- ❌ Wrong
CREATE POLICY "Insert policy" ON posts FOR INSERT
USING (auth.uid() = user_id);

-- ✅ Correct
CREATE POLICY "Insert policy" ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 2. Forgetting TO clause
```sql
-- ❌ Applies to anon users too!
CREATE POLICY "View posts" ON posts FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Explicit role
CREATE POLICY "View posts" ON posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. Circular Dependencies
```sql
-- ❌ Policy references same table - can cause issues
CREATE POLICY "View if creator has permission" ON posts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM posts WHERE created_by = auth.uid())
);

-- ✅ Use separate permission table
CREATE POLICY "View if has permission" ON posts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM permissions WHERE user_id = auth.uid())
);
```

## Related Skills

- **idempotent-migrations** - Create RLS policies idempotently
- **test-strategy-patterns** - Test RLS in integration tests

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security#best-practices)
