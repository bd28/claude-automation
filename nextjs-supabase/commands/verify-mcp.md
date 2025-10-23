---
description: Verify MCP server connections are working correctly
---

I'll test connections to all four MCP servers to ensure they're properly configured and authorized.

## Testing MCP Connections

**1. Playwright MCP** (should work immediately, no auth required):
- Test: `browser_snapshot` or `browser_navigate`
- Expected: Browser opens and returns snapshot

**2. Supabase MCP** (requires OAuth authorization):
- Test: `list_projects`
- Expected: Returns list of Supabase projects
- If fails: Run `/mcp` to complete OAuth authorization

**3. Vercel MCP** (requires OAuth authorization):
- Test: `list_projects`
- Expected: Returns list of Vercel projects
- If fails: Run `/mcp` to complete OAuth authorization

**4. Sentry MCP** (requires OAuth authorization):
- Test: `whoami`
- Expected: Returns your Sentry user information
- If fails: Run `/mcp` to complete OAuth authorization

## Running Verification Tests

Let me test each MCP now. If any fail due to missing authorization, I'll provide instructions for completing the OAuth flow.
