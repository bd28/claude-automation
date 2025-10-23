# Claude Code Automation Guide

This guide shows how to use automated workflows to ship features faster. Instead of manually running tests, creating PRs, and monitoring CI feedback, use slash commands to orchestrate complete workflows that handle everything autonomously.

**Layered DRY architecture:** CLAUDE.md (standards) → Hooks (awareness) → Skills (patterns) → Agents (specialists) → Commands (orchestrators) → GitHub CI

```
CLAUDE.md → Hooks → Skills → Agents → Commands → GitHub CI
   ↓          ↓        ↓        ↓         ↓          ↓
Standards  Auto-run Patterns Experts  Orchestrate  @claude
```

## Quick Reference

### Common Workflows

| Your Action       | Command     | What Happens                               |
| ----------------- | ----------- | ------------------------------------------ |
| Build from issue  | `/build`    | Analyze → Plan → Implement → PR → Alert    |
| Ship feature      | `/ship`     | Validate → PR → Monitor → Alert when ready |
| DB schema change  | `/schema`   | Update → Migrate → Test → Commit           |
| Test current work | `/validate` | Tests + Playwright + Supabase + Review     |
| Create PR         | `/pr`       | Validate → PR → Monitor → Iterate          |
| Monitor PR        | `/check`    | Check feedback → Fix → Iterate             |
| Merge PR          | `/merge`    | Verify → Merge → Monitor deployment        |

**Note:** All branches use `issue-###-description` format.

### Specialized Agents

| Agent             | Specialty                   | Use When                             |
| ----------------- | --------------------------- | ------------------------------------ |
| `feature-builder` | Complete feature from issue | Building features from GitHub issues |
| `code-reviewer`   | Code quality review         | Reviewing any code changes           |
| `schema-wizard`   | Database schema             | Making any schema/migration changes  |
| `test-validator`  | Comprehensive testing       | Validating functionality works       |

### Automation Skills

Built-in patterns that agents apply automatically during development:

| Skill                     | Purpose                                               | Auto-applied By                       |
| ------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `changelog-fragments`     | Create changelog entries in `.changeset/` directory   | feature-builder, schema-wizard        |
| `idempotent-migrations`   | Make database migrations safe for redeployment        | schema-wizard, feature-builder        |
| `nextjs-cache-patterns`   | Apply tag-based caching to API routes                 | feature-builder                       |
| `rls-security-patterns`   | Add Row Level Security policies to new tables         | schema-wizard, feature-builder        |
| `test-strategy-patterns`  | Follow unit-first testing with comprehensive coverage | feature-builder, test-validator       |

**Skills Location:** `nextjs-supabase/skills/` - Each skill has a `SKILL.md` with patterns, examples, and checklists.

## Automation Highlights

**From issue to production in one command:** `/build 272` analyzes GitHub issue, plans, implements, validates, creates PR (pauses for your review before merge)

**One command does it all:** `/pr` replaces 10+ manual steps (review → test → create → monitor → iterate → alert)

**Automatic without asking:**

- Quality checks (format, lint, type-check) via `/validate` and `/pr`
- Changelog fragments (create `.changeset/{issue}.md` for features/fixes) via **changelog-fragments** skill
- Idempotent migrations (safe for redeployment) via **idempotent-migrations** skill
- RLS policies (automatic security on new tables) via **rls-security-patterns** skill
- Cache patterns (tag-based API caching) via **nextjs-cache-patterns** skill
- Test strategy (unit-first comprehensive coverage) via **test-strategy-patterns** skill
- Schema validation (verify migrations, sync data, security checks) via `/schema`
- UI testing (dev server, Playwright, screenshots, real data) when UI changes detected
- PR monitoring (check CI, iterate on feedback, alert when ready) via `/pr` and `/check`

## GitHub Integration

- **Automated PR reviews** on every PR (same CLAUDE.md standards, MCP tools, categorized feedback)
- **@claude mentions** in issues/comments (full MCP access, runs workflows, follows automation rules)

## Architecture Principles

- **Single source of truth**: CLAUDE.md defines all standards (used by local + CI)
- **Composable workflows**: Agents are specialists, commands orchestrate them
- **No duplication**: Each piece of logic exists once, referenced everywhere

## Usage Tips

- **Trust workflows**: Let commands run fully without interruption
- **Use slash commands**: `/pr` is better than "create a PR"
- **Let monitoring happen**: Commands wait for CI and auto-iterate
- **Review summaries**: Claude alerts when done with comprehensive results

## Building Features from GitHub Issues

The `/build` command provides autonomous feature implementation from GitHub issues:

**Basic usage:**

```bash
/build 272                    # Default: plan approval → implement → PR → alert for merge
/build 272 --auto             # Fully autonomous: plan → implement → PR → auto-merge
/build 272 --skip-plan-approval  # Skip plan approval, still pause before merge
/build 272 --pause-before-pr  # Pause before creating PR for implementation review
```

**What it does:**

1. Fetches GitHub issue details
2. Analyzes requirements (schema changes, UI components, security considerations)
3. Creates detailed implementation plan (waits for your approval by default)
4. Executes schema changes via `schema-wizard` agent
5. Implements application code following CLAUDE.md standards
6. Updates tests and CHANGELOG.md
7. Runs comprehensive validation via `/validate`
8. Creates PR via `/pr` (monitors CI, iterates on feedback)
9. Alerts you when PR is ready for manual review and merge

**Behind the scenes:**

- Orchestrates `feature-builder` agent with full tool access
- Composes `schema-wizard`, `test-validator`, and `code-reviewer` agents
- Uses `/validate` and `/pr` commands for quality assurance
- Follows all CLAUDE.md standards and automation patterns

## GitHub Issue Collaboration

**Share visual progress with screenshots:**

```bash
# Upload Playwright screenshots to GitHub issue
npm run upload-screenshots -- --issue=268 --files=".playwright-mcp/*.png"
```

**How it works:**

1. Uploads to Supabase Storage (`github-assets` bucket)
2. Returns permanent public URLs
3. Outputs markdown for pasting into issue comments
4. Screenshots visible to entire team

**When to use:**

- After Playwright testing (share visual results)
- Documenting UI changes in issues/PRs
- Visual progress updates on features
- Bug reports with screenshots

See CLAUDE.md for complete documentation.

## Configuration

`.claude/` folder contains settings, commands, and agents. `.github/workflows/claude*.yml` for CI. `CLAUDE.md` is the single source of truth.
