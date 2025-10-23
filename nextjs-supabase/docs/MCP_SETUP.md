# MCP Setup Guide

This guide covers installation and configuration of the four MCP servers used by the nextjs-supabase automation plugin.

## Quick Setup

```bash
# Install plugin
/plugin marketplace add bd28/claude-automation
/plugin install nextjs-supabase@claude-automation

# Install MCPs
/setup-mcp

# Authorize OAuth MCPs
/mcp

# Verify connections
/verify-mcp
```

## MCP Servers Overview

### 1. Playwright MCP
**Purpose**: Browser testing, UI screenshots, automated interactions

**Installation**:
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

**Authorization**: None required (local npx execution)

**Usage**:
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Capture page state
- `browser_click` - Click elements
- `browser_screenshot` - Take screenshots
- Used automatically by `/validate` and UI testing workflows

### 2. Supabase MCP
**Purpose**: Database queries, schema inspection, data exploration

**Installation**:
```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
```

**Authorization**: OAuth flow
1. Run `/mcp` in Claude Code
2. Select Supabase from MCP list
3. Click "Authorize" button
4. Log in to Supabase in browser
5. Grant access to projects

**Usage**:
- `list_projects` - View Supabase projects
- `execute_sql` - Run SQL queries
- `list_tables` - Inspect schema
- `get_advisors` - Security/performance checks
- Used by `/schema` command and schema-wizard agent

### 3. Vercel MCP
**Purpose**: Deployment monitoring, build logs, project management

**Installation**:
```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

**Authorization**: OAuth flow
1. Run `/mcp` in Claude Code
2. Select Vercel from MCP list
3. Click "Authorize" button
4. Log in to Vercel in browser
5. Grant access to teams/projects

**Usage**:
- `list_projects` - View Vercel projects
- `list_deployments` - Check deployment history
- `get_deployment` - Inspect specific deployment
- `get_deployment_build_logs` - Debug build failures
- Used by `/ship` command and deployment workflows

### 4. Sentry MCP
**Purpose**: Error tracking, issue analysis, production debugging

**Installation**:
```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

**Authorization**: OAuth flow
1. Run `/mcp` in Claude Code
2. Select Sentry from MCP list
3. Click "Authorize" button
4. Log in to Sentry in browser
5. Grant access to organizations/projects

**Usage**:
- `whoami` - Verify authentication
- `find_organizations` - List organizations
- `search_issues` - Find error issues
- `get_issue_details` - Debug specific errors
- Used for production error analysis and debugging

## Troubleshooting

### "MCP not found" errors

**Problem**: Claude Code can't find the MCP server

**Solution**:
1. Verify installation: `claude mcp list`
2. Reinstall if missing: `/setup-mcp`
3. Restart Claude Code

### OAuth authorization fails

**Problem**: OAuth flow doesn't complete or tokens expire

**Solution**:
1. Run `/mcp` again to re-authorize
2. Check browser popup blockers
3. Ensure you're logged into the service (Supabase/Vercel/Sentry)
4. Grant all requested permissions

### "Unauthorized" or "403" errors

**Problem**: MCP is installed but authorization is missing/expired

**Solution**:
1. Run `/mcp` to complete/refresh OAuth
2. Check that you granted all permissions during OAuth
3. Verify account has access to projects/organizations

### Per-project MCP configuration

**Problem**: Need different MCP settings per project (e.g., different Supabase project)

**Solution**:
Create `.claude/settings.json` in project root:

```json
{
  "mcpServers": {
    "supabase": {
      "env": {
        "SUPABASE_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

Project-specific settings override global MCP configuration.

## Verification

Run `/verify-mcp` to test all MCP connections:

**Expected output**:
- ✅ Playwright: Browser snapshot captured
- ✅ Supabase: Projects listed
- ✅ Vercel: Projects listed
- ✅ Sentry: User information displayed

**If any fail**: Follow troubleshooting steps above or run `/mcp` to re-authorize.

## Advanced Configuration

### Pinning MCP versions

To prevent automatic updates, pin MCP versions:

```bash
# Instead of @latest, use specific version
claude mcp add playwright npx @playwright/mcp@1.2.3
```

Trade-off: Stability vs. new features

### Removing MCPs

```bash
claude mcp remove playwright
claude mcp remove supabase
claude mcp remove vercel
claude mcp remove sentry
```

### Listing installed MCPs

```bash
claude mcp list
```

Shows all installed MCP servers and their status.

## Security Notes

**OAuth tokens**:
- Managed automatically by Claude Code
- Stored securely in system keychain
- Scoped to minimum required permissions
- Can be revoked at any time from service dashboards

**No manual token management**:
- Don't store tokens in `.env` files
- Don't commit tokens to git
- OAuth handles all credential management

## Next Steps

After MCP setup:
1. Run `/verify-mcp` to ensure everything works
2. Customize `CLAUDE.md` with project-specific details
3. Run `/build` to implement your first feature!

For full automation documentation, see [AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md).
