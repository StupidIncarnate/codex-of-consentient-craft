# Standing brief for every agent on the bounty board

You were handed one bounty file from `scrolls/bounty-board/` (or a bundle of up to 3 related bounties), and this brief. Work that bounty and nothing else. `README.md` beside this file is the operator's run sheet.

Work from your assigned worktree. Never `cd` into a package.

---

## Mindset & Core Principles

1. **Do not assume these are all valid.**
   Many bounties were logged during fast walkthroughs, code audits, or older refactors. Some are marked `suspected`, some may already have been resolved, and others may be intended behavior or based on outdated assumptions.
2. **Reproduce & root cause before modifying.**
   Before changing any code, verify whether the issue actually occurs in the current codebase. Pinpoint the root cause. If the issue is not reproducible or invalid, explain why in your report so the bounty can be declined or deleted.
3. **Check for E2E issues and test coverage holes:**
   - The bug may be an E2E issue. Call that out clearly.
   - When fixing issues, if it makes sense that an E2E should guard against the bug, investigate if an E2E test already exists and isn't reporting correctly, or if there is a hole in coverage.
   - **When E2Es are needed:**
     - Whenever data funnels through multiple packages (e.g. data sending or coming from server / web sockets / gateway proxies).
     - Whenever browser user interactions are involved (e.g. copying to clipboard, scrolling, viewport interactions) that `@testing-library` in Jest cannot authentically simulate or test.
4. **Cut-and-dry vs. user input:**
   - **Cut-and-dry:** If the problem is real and the solution is straightforward and within scope, implement the fix, add real tests (including E2E if applicable), and verify.
   - **Needs decision / user input:** If the fix is not cut-and-dry (involves trade-offs, architecture questions, breaking contract changes, or ambiguous product intent), **do not guess**. Stop, bubble up the question clearly in your report under `DECISIONS / QUESTIONS`, and wait for guidance.
5. **Time limit (1 hour max):**
   If you have been working close to 1 hour or the operator prompts you to stop, immediately find a clean stopping place. Do not leave uncompiling half-edits. Report back:
   - What is done
   - What was found (root cause / reproduction details)
   - What is still left to do

---

## What you never do

The operator owns coordination across worktrees. Doing any of these breaks other agents or the repository:

1. **Never delete a file with `rm`, `git rm`, `unlink`, or a deletion script.**
   Deleting a file requires user approval and stalls execution. Instead:
   - Verify nothing imports the file (check across all packages, tests, and harnesses).
   - Move the file using plain `mv` to `<repoRoot>/tmp/deletions/<bounty-id>/<original repo-relative path>` (`mkdir -p` parent folders first).
   - List every moved file under `DELETIONS` in your report.
2. **Never edit files outside your assigned bounty scope.**
   If you notice a problem outside your scope, record it under `LEFT STANDING`. Do not fix it yourself.
3. **Never run bare repo-wide `npm run ward`.**
   Scope ward to your touched files: `npm run ward -- -- <paths>` or narrow with flags.
4. **Never run ward without your own worktree.**
   Ward commands (`ward --uncommitted`, `ward --committed`) require working in your own dedicated worktree to avoid collisions with the operator or other agents.
5. **Never run builds unless needed by your test.**
   If something you must run requires compiled output (`packages/*/dist`), build only what is required, or report "build needed" under `BUILD NEEDED`.
6. **Never run `npm install`, `npm ci`, `npm link`, or edit dependencies.**
   If a package dependency is missing or broken, report it.
7. **Never edit `.claude/settings.json`, `.mcp.json`, or `.env*` files.**
8. **Never dispatch sub-agents or forks of your own.**
   Do every step yourself within your allocated worktree.
9. **No mutation checks.**
   Do not break code on purpose to watch a test fail. Tests must assert real values, payload shapes, and state transitions.

---

## How you work

1. **Locate & verify first:**
   Check the bounty's "Where to look" and description against the current codebase. Line numbers and file names drift. When the code and bounty differ, the code wins.
2. **Write real assertions:**
   Write unit and integration tests that assert real values (states, error payloads, HTTP status codes, return shapes). Tests that only check "was called" or "rendered" do not suffice.
3. **Investigate & add E2Es where appropriate:**
   If the bug involves multi-package data flow (server/sockets) or browser actions (copy/scroll), look for existing E2E tests. If one exists but failed to catch the issue, fix it; if none exists, write an E2E test covering the hole.
4. **Verify with scoped ward:**
   Run `npm run ward -- --uncommitted` and `npm run ward -- --committed` on your touched paths.
5. **Run related e2e / integration suites:**
   If your changes touch web runtime, routes, or cross-cutting boundaries, run any related e2e or integration tests to confirm nothing else broke.
6. **Fix failures in your scope:**
   Fix any failure shown by your scoped ward run for files within your assigned scope.

---

## Your report

End your run with exactly these sections in this order:

```markdown
### CHANGED
- One line per file: path, then what changed. Quote one verbatim line from each file you wrote so the operator can inspect it.

### WARD
- The exact ward command(s) you ran, the run IDs, and the results.

### RELATED E2E / INTEGRATION
- Any related e2e or integration tests executed and their status. "None" if none applicable.

### LEFT STANDING
- Every issue, failure, or discrepancy you saw and did not fix, with path and reason. "None" if none.

### DECISIONS / QUESTIONS
- Any design choices made, or questions that require user/operator decision. "None" if none.

### BUILD NEEDED
- Packages whose compiled output must be rebuilt before the next step. "None" if none.

### DELETIONS
- Files moved to `tmp/deletions/`, one per line with original path and reason. "None" if none.

### TIME & PROGRESS (if stopped at 1 hour or handed off)
- What is done: ...
- What was found: ...
- What is still left to do: ...
```
