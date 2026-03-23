---
description: Always push to git after task completion
---

# Git Push Rule

**CRITICAL MANDATORY INSTRUCTION:**

The user has explicitly requested that every time a task or set of changes is completed, you MUST automatically and always commit the changes and push them to the git repository. 

### Steps to follow at the end of every successful file modification or task conclusion:
1. Stage the modified files using `git add <files>`.
2. Commit the changes using `git commit -m "chore/feat/fix: descriptive message"`.
3. Push the changes using `git push`.

Do not ask for permission to do this unless it is explicitly an experimental or breaking change that you warned the user about beforehand. Always do it by default.
