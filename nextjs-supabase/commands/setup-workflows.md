---
description: Copy GitHub workflow templates and scripts to project
---

I'll copy the GitHub Actions workflows and automation scripts from the plugin templates to your project.

## What Will Be Copied

**GitHub Workflows** (to `.github/workflows/`):
- `claude-code-review.yml` - Automated code reviews on PRs
- `claude.yml` - Claude Code PR workflow integration
- `update-changeset-pr.yml` - Automatic PR number updates in changesets
- `database-backup.yml` - Automated daily database backups

**Scripts** (to `scripts/`):
- `aggregate-changelog.js` - Aggregates changelog fragments into CHANGELOG.md
- `create-changelog-fragment.js` - Creates new changelog fragments
- `release.sh` - Automated release workflow
- `upload-screenshots.js` - Uploads screenshots to Supabase Storage for GitHub issues

## Configuration Required

After copying, you'll need to configure GitHub Secrets:

**Required Secrets:**
- `PRODUCTION_DB_URL` - Production database URL for backups
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for backups
- `ANTHROPIC_API_KEY` - Anthropic API key for automated reviews

**Optional Secrets:**
- `VERCEL_TOKEN` - For deployment monitoring
- `SENTRY_AUTH_TOKEN` - For error tracking integration

## Installation Steps

I'll:
1. Create `.github/workflows/` directory if it doesn't exist
2. Copy workflow files from plugin templates
3. Create `scripts/` directory if it doesn't exist
4. Copy script files from plugin templates
5. Display list of required GitHub Secrets to configure

Let me proceed with copying the files now.
