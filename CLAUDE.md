# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **claude-automation** repository - a Claude Code plugin marketplace that provides production-ready automation workflows for modern development. The repository publishes reusable automation plugins that can be installed via Claude Code's plugin system.

**Purpose**: Provide DRY, versioned, scalable automation workflows that eliminate repetitive tasks and ship features faster.

## Claude Code Documentation

This repository extensively uses Claude Code plugin features. Reference these docs when working with plugin components:

- **[Plugins](https://docs.claude.com/en/docs/claude-code/plugins)** - Plugin structure, metadata, installation, marketplace
- **[Sub-agents](https://docs.claude.com/en/docs/claude-code/sub-agents)** - Creating specialized agents (feature-builder, schema-wizard, etc.)
- **[Slash Commands](https://docs.claude.com/en/docs/claude-code/slash-commands)** - Command creation, arguments, orchestration
- **[Hooks](https://docs.claude.com/en/docs/claude-code/hooks)** - Lifecycle hooks (user-prompt-submit, tool-use, etc.)
- **[MCP](https://docs.claude.com/en/docs/claude-code/mcp)** - Model Context Protocol integration and setup

## Architecture

This repository follows a **plugin-based architecture** where each plugin is a self-contained automation package:

```
claude-automation/
├── .changeset/              # Changelog fragments (managed via release workflow)
├── .github/                 # GitHub workflows for THIS plugin repository
│   └── workflows/           # CI/CD for plugin development
├── CHANGELOG.md             # Plugin version history (generated from fragments)
├── nextjs-supabase/         # Plugin: Next.js + Supabase automation
│   ├── .claude-plugin/      # Plugin metadata (plugin.json)
│   ├── agents/              # Specialized autonomous agents
│   ├── commands/            # Slash commands (orchestrators)
│   ├── skills/              # Automation patterns (auto-applied by agents)
│   ├── templates/           # Project templates (workflows, scripts, CLAUDE.md)
│   │   ├── .github/         # Template workflows for USER projects
│   │   ├── scripts/         # Template scripts (release, changelog, etc.)
│   │   └── CLAUDE.md.template
│   ├── docs/                # Plugin documentation
│   └── hooks/               # Lifecycle hooks
```

**Important distinction:**
- **Root `.github/workflows/`** - Workflows for THIS plugin repository (reviews, releases)
- **`templates/.github/workflows/`** - Template workflows copied to user projects via `/setup-workflows`

### Key Concepts

**Layered DRY Architecture**:
```
CLAUDE.md → Hooks → Skills → Agents → Commands → GitHub CI
   ↓          ↓        ↓        ↓         ↓          ↓
Standards  Auto-run Patterns Experts  Orchestrate  @claude
```

1. **CLAUDE.md** - Single source of truth for project standards (both local and CI)
2. **Hooks** - Lifecycle awareness (auto-run validations, trigger workflows)
3. **Skills** - Reusable automation patterns (auto-applied by agents, e.g., changelog creation)
4. **Agents** - Specialized experts (feature-builder, schema-wizard, code-reviewer, test-validator)
5. **Commands** - Orchestrators (compose agents and tools, e.g., `/build`, `/pr`, `/validate`)
6. **GitHub CI** - Automated reviews and workflows using same standards

### nextjs-supabase Plugin Structure

**Agents** (`nextjs-supabase/agents/`):
- `feature-builder.md` - Autonomous feature implementation from GitHub issues
- `schema-wizard.md` - Complete database schema change workflow using Drizzle Kit
- `test-validator.md` - Comprehensive testing (unit + E2E + Playwright + Supabase)
- `code-reviewer.md` - Code reviews following CLAUDE.md standards

**Commands** (`nextjs-supabase/commands/`):
- `/build` - Autonomous feature building from GitHub issue
- `/pr` - Complete PR workflow (validate → create → monitor → iterate)
- `/validate` - Comprehensive validation (tests + E2E + code review)
- `/schema` - Database schema change workflow
- `/check` - Monitor PR checks and iterate on feedback
- `/merge` - Merge approved PR
- `/ship` - Complete workflow from changes to production
- `/setup-mcp` - Install and configure MCP servers
- `/verify-mcp` - Verify MCP connections
- `/setup-workflows` - Copy GitHub workflow templates

**Skills** (`nextjs-supabase/skills/`):
- `changelog-fragments` - Auto-create changelog entries in `.changeset/` directory
- `idempotent-migrations` - Make database migrations safe for redeployment
- `nextjs-cache-patterns` - Apply tag-based caching to API routes
- `rls-security-patterns` - Add Row Level Security policies to new tables
- `test-strategy-patterns` - Follow unit-first testing strategy

**Templates** (`nextjs-supabase/templates/`):
- `CLAUDE.md.template` - Project-specific CLAUDE.md template
- `.github/workflows/` - GitHub CI workflows (claude-code-review.yml, claude.yml, etc.)
- `scripts/` - Release automation (release.sh, aggregate-changelog.js, etc.)

## Development Workflow

### Plugin Development

When working on plugins in this repository:

1. **Understanding the structure**:
   - Each plugin lives in its own directory (e.g., `nextjs-supabase/`)
   - Plugin metadata in `.claude-plugin/plugin.json` defines name, version, author
   - Commands are markdown files with YAML frontmatter in `commands/`
   - Agents are markdown files with YAML frontmatter in `agents/`
   - Skills are directories with `SKILL.md` file in `skills/`

2. **Creating new commands**:
   - Add markdown file to `{plugin}/commands/`
   - Include YAML frontmatter: `name`, `description`, `argument-hint`, `allowed-tools`
   - Commands orchestrate agents and tools to complete workflows

3. **Creating new agents**:
   - Add markdown file to `{plugin}/agents/`
   - Include YAML frontmatter: `name`, `description`, `model`
   - Agents are specialists that work autonomously on specific tasks

4. **Creating new skills**:
   - Create directory in `{plugin}/skills/` with `SKILL.md` file
   - Include YAML frontmatter: `name`, `version`, `description`, `applies_to`, `trigger`
   - Skills contain reusable patterns that agents apply automatically

5. **Testing changes**:
   - Install plugin locally: `/plugin install {plugin-name}@.` from repository root
   - Test commands: `/{command-name}` to verify functionality
   - Verify agent behavior by invoking via commands or Task tool

### Changelog Management

This repository uses **changelog fragments** for version management:

**Creating fragments**:
```bash
# Manually create fragment file
# Copy template if exists: cp .changeset/_template.md .changeset/{issue-number}.md
# Or create new file: .changeset/{issue-number}.md
```

**Fragment structure** (`.changeset/{issue}.md`):
```markdown
### [Added|Changed|Fixed|Deprecated|Removed|Security]
- Description of change [#{issue}] [PR#{pr}]
  - Additional details if needed
  - Sub-items for complex changes
```

**When to create**:
- New features, bug fixes, security patches
- Breaking changes, deprecations, removed features
- Notable dependency updates or documentation changes

**Skip for**:
- Internal refactoring with no user impact
- Code comments only, formatting changes
- Test-only changes

**CHANGELOG.md generation**:
- Root `CHANGELOG.md` tracks plugin version history
- Generated by `release.sh` script (aggregates fragments)
- Fragments are moved to archive after aggregation
- Manual edits to CHANGELOG.md will be preserved

### Release Process

Releases are managed via the `release.sh` script:

```bash
# Interactive release (prompts for version bump)
npm run release

# Automated release
RELEASE_TYPE=minor SKIP_PROMPTS=true npm run release

# Custom version
CUSTOM_VERSION=2.1.0 SKIP_PROMPTS=true npm run release
```

**What happens**:
1. Aggregates changelog fragments from `.changeset/` into `CHANGELOG.md`
2. Bumps version in `plugin.json` and `package.json` (if exists)
3. Creates git tag `v{version}`
4. Pushes to GitHub
5. Creates GitHub release (optional)

### Version Management

Plugins follow semantic versioning:
- **Major** (1.0.0 → 2.0.0) - Breaking changes to commands, agents, or workflows
- **Minor** (1.0.0 → 1.1.0) - New features, new skills, new commands
- **Patch** (1.0.0 → 1.0.1) - Bug fixes, documentation updates

### Publishing to Marketplace

Plugins are published to GitHub and installed via marketplace URL:

```bash
# Users install with:
/plugin marketplace add bd28/claude-automation
/plugin install nextjs-supabase@claude-automation

# Specific version:
/plugin install nextjs-supabase@1.2.0@claude-automation
```

Repository structure for marketplace:
- Plugins discovered from repository root
- Each plugin directory must have `.claude-plugin/plugin.json`
- Marketplace URL format: `{github-user}/{repo-name}`

## Command Reference

Since this is a plugin repository, there are no build or test commands for the repository itself. However, the plugins provide templates for project-specific commands.

**For plugin development**:
```bash
# Test plugin locally
/plugin install nextjs-supabase@.

# Verify plugin commands
/build --help
/pr --help
/validate --help
```

**For release management**:
```bash
# Create changelog fragment (if scripts copied to project)
npm run changelog:add

# Create release (if scripts copied to project)
npm run release
```

## MCP Integration

The `nextjs-supabase` plugin integrates four MCP servers:

1. **Playwright MCP** - Browser testing, UI screenshots (no auth required)
2. **Supabase MCP** - Database queries, schema inspection (OAuth)
3. **Vercel MCP** - Deployment monitoring (OAuth)
4. **Sentry MCP** - Error tracking (OAuth)

Setup via `/setup-mcp` command (part of nextjs-supabase plugin).

## GitHub Integration

### Plugin Repository Workflows

**Root `.github/workflows/`** - CI/CD for this plugin repository:

**Automated code reviews** (`claude-code-review.yml`):
- Runs on every PR to the plugin repo
- Reviews plugin code (agents, commands, skills)
- Uses CLAUDE.md standards
- Posts categorized feedback

**Changelog automation** (`update-changeset-pr.yml`):
- Updates `.changeset/{issue}.md` with PR number
- Posts summary to GitHub issue
- Commits back to main

**Release automation** (optional):
- Triggered on version tags
- Runs `release.sh` to aggregate changelog
- Creates GitHub release with notes

### Template Workflows for User Projects

**`templates/.github/workflows/`** - Workflows copied to user projects:

**Automated code reviews** (`claude-code-review.yml`):
- Adapted for Next.js + Supabase projects
- Database and browser testing with MCP
- Project-specific standards from user's CLAUDE.md

**Database backups** (`database-backup.yml`):
- Automated Supabase backups
- Daily backups with retention

**@claude mentions** (`claude.yml`):
- Responds to `@claude` in project issues/comments
- Full MCP access and workflow capabilities

## Documentation

Each plugin maintains its own documentation:

- `README.md` - Plugin overview, installation, quick start
- `docs/AUTOMATION_GUIDE.md` - Complete workflow documentation
- `docs/MCP_SETUP.md` - MCP installation and troubleshooting
- `templates/CLAUDE.md.template` - Template for user projects

## Plugin Customization

Users customize plugins for their projects:

1. **Copy CLAUDE.md template**:
   ```bash
   cp node_modules/.claude-plugins/nextjs-supabase@claude-automation/templates/CLAUDE.md.template CLAUDE.md
   ```

2. **Copy GitHub workflows**:
   ```bash
   /setup-workflows
   ```

3. **Override MCP settings** in `.claude/settings.json`:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "env": {
           "SUPABASE_PROJECT_ID": "custom-id"
         }
       }
     }
   }
   ```

## Contributing

When contributing to this repository:

1. **Create feature branch**: `git checkout -b issue-###-description`
2. **Make changes** to plugin files (agents, commands, skills, templates)
3. **Test locally**: `/plugin install {plugin-name}@.` from repository root
4. **Create changelog fragment**:
   ```bash
   # Copy template
   cp .changeset/_template.md .changeset/{issue-number}.md
   # Edit fragment with your changes
   # Use format: - Description [#{issue}] [PR#0]
   ```
5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: description"
   git push -u origin issue-###-description
   ```
6. **Create PR**: Include "Closes #123" or "Fixes #123" in PR description
7. **Review process**:
   - Claude Code Review bot will review automatically
   - Address any critical/important feedback
   - Merge after approval
8. **After merge**:
   - GitHub Actions updates `[PR#0]` to actual PR number
   - Posts summary to GitHub issue
   - Changes included in next release

## Design Philosophy

**DRY (Don't Repeat Yourself)**:
- Single source of truth for automation logic
- Skills applied automatically by agents
- Templates reused across projects

**Composability**:
- Agents are specialists (feature-builder, schema-wizard)
- Commands orchestrate agents (build → validate → pr)
- Skills provide patterns (changelog, migrations, caching)

**Versioning**:
- Semantic versioning for predictable updates
- Marketplace distribution for easy installation
- Per-project customization via templates

**Team-Friendly**:
- Consistent tooling across organization
- Update once, all projects benefit
- Clear documentation and examples
