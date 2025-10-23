# Claude Automation

Production-ready automation plugins for Claude Code. Ship features faster with autonomous workflows, comprehensive testing, and intelligent code reviews.

## Available Plugins

### nextjs-supabase

Complete automation for Next.js + Supabase projects.

**Features:**
- 🚀 Autonomous feature building from GitHub issues (`/build`)
- 🔄 Complete PR workflow (`/pr`, `/check`, `/merge`, `/ship`)
- 🗄️ Database schema wizard (`/schema`)
- ✅ Comprehensive validation (`/validate`)
- 🎭 Browser testing with Playwright MCP
- 🗃️ Database operations with Supabase MCP
- 📦 Deployment monitoring with Vercel MCP
- 🐛 Error tracking with Sentry MCP
- 🧠 5 automation skills (changelog, migrations, caching, RLS, testing)
- 🤖 Automated code reviews on PRs

**Install:**
```bash
/plugin marketplace add bd28/claude-automation
/plugin install nextjs-supabase@claude-automation
```

## Quick Start

### 1. Install Plugin

```bash
# Add marketplace
/plugin marketplace add bd28/claude-automation

# Install plugin
/plugin install nextjs-supabase@claude-automation
```

### 2. Setup MCPs

```bash
# Install all four MCP servers
/setup-mcp

# Authorize OAuth MCPs (Supabase, Vercel, Sentry)
/mcp

# Verify connections
/verify-mcp
```

### 3. Copy Templates

```bash
# Copy GitHub workflows and scripts
/setup-workflows

# Copy and customize CLAUDE.md
cp node_modules/.claude-plugins/nextjs-supabase@claude-automation/templates/CLAUDE.md.template CLAUDE.md
# Edit with your project-specific details
```

### 4. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Required:**
- `PRODUCTION_DB_URL` - Production database URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - Anthropic API key for automated reviews

**Optional:**
- `VERCEL_TOKEN` - For deployment monitoring
- `SENTRY_AUTH_TOKEN` - For error tracking

### 5. Start Building!

```bash
/build 1  # Autonomous feature implementation from GitHub issue
```

## Automation Workflows

### `/build <issue-number>`

Autonomous feature implementation from GitHub issues:
- Analyzes requirements
- Plans implementation (with optional approval)
- Implements code following all standards
- Runs comprehensive validation
- Creates production-ready PR
- Monitors CI and iterates on feedback
- Alerts when ready for merge

**Options:**
```bash
/build 272                    # Default: plan approval, pause before merge
/build 272 --auto             # Fully autonomous: skip plan approval + auto-merge
/build 272 --skip-plan-approval
/build 272 --pause-before-pr
```

### `/pr`

Complete PR workflow:
- Runs code-reviewer agent
- Runs comprehensive validation
- Creates PR with detailed description
- Monitors CI checks
- Iterates on feedback automatically
- Alerts when merge-ready

### `/validate`

Comprehensive validation:
- Runs tests (unit + E2E)
- Checks code quality
- Verifies database schema
- Tests with Playwright MCP
- Validates Supabase configuration

### `/schema`

Database schema management:
- Updates schema with Drizzle
- Generates migrations
- Adds RLS policies
- Runs security checks
- Tests locally before deployment

### `/check`

Monitor PR and iterate:
- Checks CI status
- Reads automated review feedback
- Implements fixes
- Repeats until merge-ready

### `/merge <pr-number>`

Merge approved PR:
- Verifies all checks pass
- Merges to main
- Monitors deployment
- Alerts on completion

### `/ship`

Complete workflow from changes to production:
- Validates code
- Creates PR
- Monitors CI
- Merges when approved
- Deploys to production

## MCP Stack

### Playwright MCP
- **Purpose**: Browser testing, UI screenshots
- **Auth**: None required
- **Install**: Included in `/setup-mcp`

### Supabase MCP
- **Purpose**: Database queries, schema management
- **Auth**: OAuth (run `/mcp` after installation)
- **Install**: Included in `/setup-mcp`

### Vercel MCP
- **Purpose**: Deployment monitoring
- **Auth**: OAuth (run `/mcp` after installation)
- **Install**: Included in `/setup-mcp`

### Sentry MCP
- **Purpose**: Error tracking, debugging
- **Auth**: OAuth (run `/mcp` after installation)
- **Install**: Included in `/setup-mcp`

See [MCP_SETUP.md](nextjs-supabase/docs/MCP_SETUP.md) for detailed setup instructions.

## Included Agents

### feature-builder
Autonomous feature implementation from GitHub issues. Orchestrates all other agents and workflows.

### schema-wizard
Complete database schema change workflow using Drizzle Kit. Handles migrations, RLS policies, and security checks.

### test-validator
Comprehensive testing: unit tests, E2E tests, Playwright, Supabase validation.

### code-reviewer
Reviews code following standards defined in CLAUDE.md. Provides categorized feedback (critical/important/optional).

## Automation Skills

Built-in patterns that agents apply automatically:

### changelog-fragments
Creates changelog entries in `.changeset/` directory for features and fixes. Fragments are aggregated during releases.

### idempotent-migrations
Makes database migrations safe for redeployment with conditional checks (IF NOT EXISTS, etc.). Prevents migration failures in CI/CD.

### nextjs-cache-patterns
Applies tag-based caching to API routes with automatic revalidation. Improves performance and reduces database load.

### rls-security-patterns
Automatically adds Row Level Security policies to new database tables. Enforces security by default.

### test-strategy-patterns
Follows unit-first testing strategy with comprehensive coverage. Ensures fast, reliable tests with minimal maintenance.

**Location:** `nextjs-supabase/skills/` - Each skill has detailed patterns, examples, and checklists.

## GitHub Workflows

### claude-code-review.yml
Automated code reviews on every PR:
- Uses same CLAUDE.md standards as local reviews
- Full MCP access for database/browser testing
- Categorized feedback (critical/important/optional)
- Comments directly on PR

### update-changeset-pr.yml
Automatic PR number updates:
- Extracts issue number from PR
- Updates `.changeset/{issue}.md` with PR number
- Posts summary comment on GitHub issue
- Commits back to main

### database-backup.yml
Automated daily database backups:
- Runs at 2 AM UTC
- Stores in Supabase Storage
- 30-day retention + monthly snapshots
- Automatic cleanup

## Scripts

### changelog-add.js
Interactive CLI for creating changelog fragments:
```bash
npm run changelog:add
```

### aggregate-changelog.js
Aggregates fragments into CHANGELOG.md (used by release script)

### release.sh
Automated release workflow:
```bash
npm run release
```

### upload-screenshots.js
Upload screenshots to Supabase Storage for GitHub issues:
```bash
npm run upload-screenshots -- --issue=123 --files="*.png"
```

## Documentation

- [Automation Guide](nextjs-supabase/docs/AUTOMATION_GUIDE.md) - Complete automation workflow documentation
- [MCP Setup](nextjs-supabase/docs/MCP_SETUP.md) - MCP installation and configuration
- [CLAUDE.md Template](nextjs-supabase/templates/CLAUDE.md.template) - Project configuration template

## Benefits

✅ **DRY**: Single source of truth for automation logic
✅ **Versioned**: Semantic versioning via marketplace
✅ **Scalable**: Works across unlimited projects
✅ **Fast Setup**: 15 minutes vs 4 hours manual setup
✅ **Team-Friendly**: Consistent tooling across organization
✅ **Maintainable**: Update once, all projects benefit
✅ **Secure**: OAuth for MCP credentials
✅ **Complete**: Full automation from issue to production

## Version Management

The plugin uses semantic versioning:

**Install specific version:**
```bash
/plugin install nextjs-supabase@1.0.0@claude-automation
```

**Install latest:**
```bash
/plugin install nextjs-supabase@claude-automation
```

**Update plugin:**
```bash
/plugin update nextjs-supabase@claude-automation
```

## Customization

### Per-Project CLAUDE.md

Each project should customize CLAUDE.md with:
- Project architecture and data flow
- Database schema overview
- API routes and endpoints
- Project-specific commands
- Environment variables

Use the template:
```bash
cp node_modules/.claude-plugins/nextjs-supabase@claude-automation/templates/CLAUDE.md.template CLAUDE.md
```

### Per-Project MCP Configuration

Override MCP settings in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "env": {
        "SUPABASE_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## Troubleshooting

### Plugin installation fails

**Check:**
1. Claude Code is up to date
2. Marketplace URL is correct: `bd28/claude-automation`
3. Internet connection is stable

**Fix:**
```bash
/plugin marketplace remove claude-automation
/plugin marketplace add bd28/claude-automation
/plugin install nextjs-supabase@claude-automation
```

### MCP authorization fails

**Fix:**
1. Run `/mcp` to re-authorize
2. Check browser popup blockers
3. Ensure logged into service (Supabase/Vercel/Sentry)
4. Grant all requested permissions

See [MCP_SETUP.md](nextjs-supabase/docs/MCP_SETUP.md) for detailed troubleshooting.

### Commands not working

**Check:**
1. Plugin is installed: `/plugin list`
2. Commands exist: Check `nextjs-supabase/commands/` directory
3. Claude Code restarted after plugin installation

### Workflows not running

**Check:**
1. Workflows copied to `.github/workflows/`
2. GitHub Secrets configured
3. Workflows enabled in repository settings

## Contributing

Contributions welcome! To suggest improvements:

1. Create issue describing the enhancement
2. Fork repository
3. Create feature branch
4. Submit PR with clear description

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: https://github.com/bd28/claude-automation/issues
- **Discussions**: https://github.com/bd28/claude-automation/discussions
- **Documentation**: https://github.com/bd28/claude-automation

## Acknowledgments

Built with Claude Code and inspired by modern DevOps automation practices.

---

**Ready to 10x your productivity?**

```bash
/plugin marketplace add bd28/claude-automation
/plugin install nextjs-supabase@claude-automation
/build 1
```

Ship features faster. Build better software. 🚀