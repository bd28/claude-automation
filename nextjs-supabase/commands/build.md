---
name: build
description: Build a feature from GitHub issue using feature-builder agent
argument-hint: <issue-number> [--auto] [--skip-plan-approval] [--pause-before-pr] [--auto-merge]
allowed-tools: Task
---

Invoke the feature-builder agent to autonomously build a feature from GitHub issue.

**Parse $ARGUMENTS to extract:**
- Issue number (required, e.g., "272")
- Optional flags:
  - `--auto` (shorthand for `--skip-plan-approval --auto-merge`)
  - `--skip-plan-approval`
  - `--pause-before-pr`
  - `--auto-merge`

Use the Task tool to invoke the feature-builder agent with this prompt:

```
Use feature-builder to implement issue #{issue_number}.

Build the complete feature following all project standards:
1. Analyze the issue requirements
2. Plan implementation in Plan Mode
3. Implement all code changes
4. Validate quality comprehensively
5. Create production-ready PR
6. Alert user when PR is ready for manual review and merge

{Include appropriate flags based on $ARGUMENTS:}
- If --auto: "Skip plan approval and auto-merge when approved (fully autonomous)"
- If --skip-plan-approval: "Skip plan approval and proceed autonomously after planning"
- If --pause-before-pr: "Pause before creating the PR for manual review"
- If --auto-merge: "Auto-merge when approved"

Default behavior: Pause for plan approval, auto-create PR, pause before merge for manual review.

Note: --auto is shorthand for --skip-plan-approval --auto-merge
```

The feature-builder agent orchestrates:
- schema-wizard agent for database changes
- test-validator agent for comprehensive testing (via /validate)
- code-reviewer agent for quality checks (via /validate)
- /pr command for PR creation and CI monitoring

## Usage Examples

```bash
# Default: pause for plan approval, auto-create PR, pause before merge
/build 272

# Fully autonomous (skip plan approval + auto-merge)
/build 272 --auto

# Skip plan approval only (still pause before merge)
/build 272 --skip-plan-approval

# Pause before creating PR
/build 272 --pause-before-pr

# Granular control (can combine individual flags)
/build 272 --skip-plan-approval --auto-merge  # Same as --auto
```
