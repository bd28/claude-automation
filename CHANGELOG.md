# Changelog

All notable changes to the claude-automation plugin marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Implement 5 automation skills for development workflows [#1] [PR#2]
  - **changelog-fragments**: Create changelog entries in `.changeset/` directory
  - **idempotent-migrations**: Make database migrations safe for redeployment
  - **nextjs-cache-patterns**: Apply tag-based caching to API routes
  - **rls-security-patterns**: Add Row Level Security policies to new tables
  - **test-strategy-patterns**: Follow unit-first testing strategy
- Integrate skills with all agents (feature-builder, schema-wizard, code-reviewer, test-validator)
- Update documentation to explain skills system

## [1.0.0] - 2025-10-23

### Added
- Initial release of nextjs-supabase automation plugin
- 4 specialized agents: feature-builder, schema-wizard, code-reviewer, test-validator
- 10 slash commands: /build, /pr, /validate, /check, /merge, /ship, /schema, /setup-mcp, /verify-mcp, /setup-workflows
- MCP integration: Playwright, Supabase, Vercel, Sentry
- GitHub workflow templates: claude-code-review.yml, claude.yml, database-backup.yml, update-changeset-pr.yml
- Release automation scripts: release.sh, aggregate-changelog.js, create-changelog-fragment.js, upload-screenshots.js
- Comprehensive documentation: README.md, AUTOMATION_GUIDE.md, MCP_SETUP.md, CLAUDE.md.template
- Plugin marketplace distribution via bd28/claude-automation
