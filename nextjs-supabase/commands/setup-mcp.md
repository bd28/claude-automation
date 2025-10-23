---
description: Install and configure MCP servers for Next.js + Supabase projects
---

I'll install the required MCP servers for this automation stack: Playwright, Supabase, Vercel, and Sentry.

## MCP Installation

Running the following commands to install each MCP server:

**1. Playwright MCP** (local, no auth needed):
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

**2. Supabase MCP** (HTTP transport with OAuth):
```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
```

**3. Vercel MCP** (HTTP transport with OAuth):
```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

**4. Sentry MCP** (HTTP transport with OAuth):
```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

## Next Steps

After installation completes:

1. **Authorize OAuth MCPs**: Run `/mcp` in Claude Code to complete OAuth authorization for Supabase, Vercel, and Sentry
2. **Verify connections**: Run `/verify-mcp` to test that all MCPs are working correctly
3. **Start using**: MCPs will be available immediately in your next Claude Code session

## What Each MCP Provides

- **Playwright**: Browser testing, UI screenshots, automated interactions
- **Supabase**: Database queries, schema inspection, data exploration
- **Vercel**: Deployment monitoring, build logs, project management
- **Sentry**: Error tracking, issue analysis, production debugging

Let me install these now using the Bash tool.
