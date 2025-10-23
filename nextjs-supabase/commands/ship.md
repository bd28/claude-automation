---
name: ship
description: Complete workflow from current changes to production - validate, PR, merge, deploy
---

Ship current changes to production (complete end-to-end workflow):

1. **Validate**: Run `/validate` to ensure quality
2. **Create PR**: Run `/pr` to create and monitor PR
3. **Wait for approval**: Alert user and wait for approval
4. **Merge**: Run `/merge` to deploy to production
5. **Verify**: Check production deployment succeeded

This is the complete workflow from local changes to production.

Execute steps 1-2 autonomously, then alert user for approval before merge.
