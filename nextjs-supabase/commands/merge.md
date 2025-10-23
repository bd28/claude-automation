---
name: merge
description: Merge PR
---

Merge the current PR:

1. **Get PR number** from current branch
2. **Verify PR is approved** and all checks pass
3. **Merge** with `gh pr merge <PR_NUMBER> --squash --delete-branch`
4. **Switch to main** and pull latest changes
5. **Report**:
   - What was merged
   - Next steps if any