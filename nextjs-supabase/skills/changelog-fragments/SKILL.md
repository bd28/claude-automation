---
name: changelog-fragments
version: 1.0.0
description: Automatically create changelog entries for features, fixes, and notable changes
category: documentation
tags: [changelog, documentation, versioning]
applies_to: [feature-builder, schema-wizard, code-reviewer]
trigger: when_creating_features_or_fixes
priority: high
---

# Changelog Fragments Skill

## Purpose

Automatically create structured changelog entries whenever you make features, fixes, or other notable changes. This ensures consistent documentation and helps users understand what has changed in each release.

## When to Apply This Skill

Apply this skill automatically when:
- Implementing new features
- Fixing bugs
- Making breaking changes
- Adding deprecations
- Improving security
- Making notable changes to documentation or dependencies

Do NOT apply when:
- Making internal refactoring with no user-visible impact
- Updating test code only
- Making trivial formatting changes

## How to Apply This Skill

### 1. Identify Change Category

Choose the appropriate category based on [Keep a Changelog](https://keepachangelog.com/) conventions:

- **Added** - New features, capabilities, or functionality
- **Changed** - Changes to existing functionality (non-breaking)
- **Deprecated** - Features that will be removed in future versions
- **Removed** - Features that have been removed
- **Fixed** - Bug fixes
- **Security** - Security improvements or vulnerability fixes

### 2. Write User-Focused Entry

Format:
```markdown
### [Category]
- Brief description of change from user perspective [#issue-number]
```

Guidelines:
- Write from user perspective (not implementation details)
- Focus on "what" and "why", not "how"
- Keep it concise (1-2 sentences)
- Reference GitHub issue number when applicable
- Start with action verb (Add, Fix, Update, Remove, etc.)

### 3. Create Fragment File

Create a fragment file in `.changeset/` directory named `{issue-number}.md`:

```markdown
<!-- .changeset/1.md -->
### Added
- Implement 5 automation skills for development workflows [#1]
- Add changelog-fragments skill for automatic changelog updates
```

**Important:**
- DO NOT update CHANGELOG.md directly
- Fragments are automatically aggregated into CHANGELOG.md during releases
- One fragment file per GitHub issue
- File name should be `{issue-number}.md` (e.g., `42.md` for issue #42)

### 4. Verify Entry Quality

Check that your entry:
- Is written from user perspective
- Clearly describes the benefit or impact
- Uses proper grammar and punctuation
- Includes issue reference (when applicable)
- Is in the correct category
- Follows existing entry style in the changelog

## Examples

### Good Examples

```markdown
### Added
- Add Row Level Security policies to new database tables automatically [#42]
- Implement tag-based caching for API routes with automatic revalidation [#38]

### Fixed
- Fix database migration rollback issues when migrations fail mid-execution [#55]
- Resolve Next.js cache invalidation race condition in high-traffic scenarios [#61]

### Changed
- Update test strategy to require unit tests before integration tests [#28]
- Improve schema validation error messages with actionable suggestions [#33]
```

### Bad Examples

```markdown
### Added
- Added some code changes
  ❌ Too vague, no useful information

### Fixed
- Refactored the DatabaseService class to use singleton pattern
  ❌ Implementation detail, not user-focused

### Changed
- Updated stuff
  ❌ Unclear, no actionable information
```

## Integration Points

This skill is automatically applied by:
- **feature-builder agent** - After implementing features (step 6)
- **schema-wizard agent** - After schema changes (if user-visible)
- **code-reviewer agent** - Validates changelog entry exists and is well-written

## Checklist

When applying this skill, verify:
- [ ] Fragment file created in `.changeset/` directory
- [ ] File named correctly (`{issue-number}.md`)
- [ ] Entry is in correct category (Added, Changed, Fixed, etc.)
- [ ] Entry is written from user perspective
- [ ] Entry clearly describes benefit or impact
- [ ] Entry includes issue reference (when applicable)
- [ ] Entry follows existing style and formatting
- [ ] CHANGELOG.md was NOT updated directly

## Related Skills

- **test-strategy-patterns** - Write tests before updating changelog
- **rls-security-patterns** - Document security improvements in changelog

## References

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
