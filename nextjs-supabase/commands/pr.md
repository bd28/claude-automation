---
name: pr
description: Complete PR workflow - validate, create PR, monitor checks, iterate until merge-ready
---

Execute complete PR workflow autonomously:

1. **Pre-PR Validation**
   - Run `/validate` workflow (test-validator + code-reviewer)
   - Fix all critical issues
   - Verify CHANGELOG.md updated (required for features, fixes, notable changes)
   - Ensure `npm run check-all` passes 100%

2. **Create Feature Branch & Commit** (if not already done)
   - Create branch with appropriate name
   - Stage changes
   - Generate descriptive commit message from git diff
   - Commit changes

3. **Create Pull Request**
   - Push branch to origin
   - Analyze changes to generate comprehensive PR description
   - Create PR with `gh pr create`
   - Save PR number for monitoring

4. **Monitor CI Checks** (wait 3-4 minutes)
   - Check Vercel preview build status
   - Check for automated Claude Code review comments
   - Use `gh pr view` to see status

5. **Address Feedback** (if any issues found)
   - Review automated code review comments
   - Fix critical and important issues
   - Comment on PR about changes made
   - Commit and push fixes
   - Wait for new checks
   - Repeat until clean

6. **Alert User When Ready**
   - PR link
   - Summary of changes
   - Number of review iterations needed
   - Any outstanding optional suggestions

Execute all steps without asking for permission.