---
name: idempotent-migrations
version: 1.0.0
description: Make database migrations safe for redeployment with idempotent patterns
category: database
tags: [migrations, database, drizzle, idempotency]
applies_to: [schema-wizard, feature-builder]
trigger: when_creating_migrations
priority: critical
---

# Idempotent Migrations Skill

## Purpose

Ensure all database migrations are safe to run multiple times without errors or unintended side effects. This prevents migration failures in CI/CD pipelines and makes deployments more reliable.

## When to Apply This Skill

Apply this skill automatically when:
- Creating new database migrations
- Adding or modifying tables, columns, or constraints
- Creating or updating database functions/triggers
- Adding or modifying indexes
- Creating or updating views

Do NOT skip this skill - it should be applied to ALL migrations.

## How to Apply This Skill

### 1. Use Conditional Checks

Always wrap DDL statements in conditional checks to prevent errors on re-runs:

#### Creating Tables
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Adding Columns
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
END $$;
```

#### Creating Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### Adding Constraints
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_email_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_check
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
  END IF;
END $$;
```

### 2. Handle Type Changes Safely

When modifying column types, use conditional logic:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'price'
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2);
  END IF;
END $$;
```

### 3. Drop Operations (Use with Caution)

Only drop objects if they exist:

```sql
DROP TABLE IF EXISTS old_table CASCADE;
DROP INDEX IF EXISTS old_index;
DROP FUNCTION IF EXISTS old_function(param_types) CASCADE;
```

**Warning**: Always verify dropping objects won't break production before deploying.

### 4. Use Transactions

Wrap migrations in transactions for atomicity:

```sql
BEGIN;

-- All migration statements here

COMMIT;
```

For Drizzle migrations, this is automatic.

### 5. Test Idempotency Locally

Before committing, run the migration twice locally:

```bash
# First run
npm run db:migrate

# Second run - should complete without errors
npm run db:migrate
```

### 6. Handle Default Values

When adding columns with defaults, use conditional logic to avoid resetting existing values:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
  END IF;
END $$;
```

## Examples

### Good Examples

#### Table Creation
```sql
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published) WHERE published = TRUE;
```

#### Column Addition
```sql
-- Add 'verified' column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verified'
  ) THEN
    ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;
```

#### Function Creation
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

### Bad Examples

```sql
-- ❌ Not idempotent - will fail on second run
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL
);

-- ❌ Not idempotent - will fail if column exists
ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;

-- ❌ Not idempotent - will fail if index exists
CREATE INDEX idx_users_email ON users(email);

-- ❌ Not idempotent - will fail if constraint exists
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE(email);
```

## Integration Points

This skill is automatically applied by:
- **schema-wizard agent** - When generating migrations (step 2)
- **feature-builder agent** - When database changes are needed (step 3)

## Checklist

When applying this skill, verify:
- [ ] All CREATE statements use IF NOT EXISTS
- [ ] All DROP statements use IF EXISTS
- [ ] Column additions check for existing columns
- [ ] Constraint additions check for existing constraints
- [ ] Index creations use IF NOT EXISTS
- [ ] Type changes check current type before modifying
- [ ] Migration tested locally by running twice
- [ ] No hard-coded values that might override existing data
- [ ] Transactions used where appropriate (automatic in Drizzle)

## Common Patterns

### Check if Table Exists
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'my_table') THEN
    CREATE TABLE my_table (...);
  END IF;
END $$;
```

### Check if Column Exists
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'my_column'
  ) THEN
    ALTER TABLE my_table ADD COLUMN my_column TEXT;
  END IF;
END $$;
```

### Check if Index Exists
```sql
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);
```

### Check if Constraint Exists
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'my_constraint'
  ) THEN
    ALTER TABLE my_table ADD CONSTRAINT my_constraint CHECK (...);
  END IF;
END $$;
```

## Related Skills

- **rls-security-patterns** - Apply RLS policies idempotently
- **test-strategy-patterns** - Test migrations thoroughly before deployment

## References

- [PostgreSQL IF NOT EXISTS](https://www.postgresql.org/docs/current/sql-createtable.html)
- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)
