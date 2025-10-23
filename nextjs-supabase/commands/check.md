---
name: check
description: Monitor PR checks and iterate on feedback until merge-ready
---

Monitor and respond to PR feedback:

1. **Get current PR** (from current branch)
   - Use `gh pr view` to get PR details
   - Check CI status (Vercel, automated review)

2. **Wait for checks** (if still running)
   - Checks typically take 3-4 minutes
   - Wait 60s and check again if in progress

3. **Review feedback**
   - Read automated Claude Code review comments
   - Categorize: Critical vs Important vs Optional

4. **Fix issues** (if any found)
   - Address critical and important items
   - Run code-reviewer agent to verify fixes
   - Comment on PR explaining changes
   - Commit and push

5. **Repeat** until PR is clean
   - Wait for new checks
   - Review new feedback
   - Continue until merge-ready

6. **Alert user** when ready to merge

Execute autonomously - don't ask between iterations.
