---
name: validate
description: Comprehensive validation - orchestrates test-validator and code-reviewer agents
---

Run comprehensive validation on current changes:

1. **Run test-validator agent** to execute all quality checks
2. **If validation fails**: Fix issues and re-run
3. **Once passing**: Run code-reviewer agent
4. **If critical issues found**: Fix and repeat from step 1
5. **Report final status**: Ready for PR or needs more work

Execute autonomously without asking for permission between steps.