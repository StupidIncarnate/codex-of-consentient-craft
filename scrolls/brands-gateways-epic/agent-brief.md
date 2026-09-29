# Standing brief for every agent on the brands and gateways epic

You were handed one item file from `scrolls/brands-gateways-epic/items/`, and possibly a list of files
within it. Do that item, or the part of it you were named, and nothing else. `EPIC.md` beside this file
is the operator's run sheet; read its "Concessions" table before you start, because it overrides the
source docs.

Work from the worktree root, `worktrees/gateway-pivot`. Never `cd` into a package.

## What you never do

The operator owns these. Doing any of them breaks another agent's work:

1. Never build: no `npm run build`, no `build:clean`, no `tsc -b`. If something you must run needs
   compiled output, stop and report "build needed" with the package name.
2. Never create a branch, commit, `git add`, `git mv`, `git stash`, `git checkout -- <file>` or `git reset`. The git index
   is shared. Move a file by writing the new file and moving the old one out per rule 8.
3. Never run a bare `npm run ward`. Scope it to your files: `npm run ward -- -- <paths>`, or narrow with
   `--only`. See the `<dungeonmaster-ward>` snippet.
4. Never `npm install`, `npm ci`, `npm link` or `npm rebuild`. If a dependency is missing, report it.
5. Never edit `.claude/settings.json`, `.mcp.json` or any `.env*` file.
6. Never dispatch sub-agents or forks of your own. A fork edits the same checkout in parallel with you, and SL7's forks re-did its whole migration beside it. Do every step yourself.
7. Never edit files outside your item's scope. When you find a problem outside it, report it under LEFT
   STANDING. Do not fix it yourself.
8. Never delete a file: no `rm`, `git rm`, `unlink`, and no script that deletes. Deletion needs the user's
   approval, and waiting for it stalls everyone (EPIC rule 20). Instead, once nothing imports the file (prove it
   with `discover`, tests and harnesses included), move it with plain `mv` to
   `<repoRoot>/tmp/deletions/<your item>/<its original repo-relative path>` (`mkdir -p` the folders first), and list
   it under DELETIONS in your report. Temporary files your own test or script creates under `tmp/` or the OS `/tmp`
   are the one exception. Never restore a file with `git show HEAD:<path> > <path>` either: another agent's
   uncommitted work may be in it.

## Before you write code

1. Call `get-architecture` and `get-testing-patterns` once. Call `get-folder-detail` once per folder type
   you write into.
2. Locate files with `get-project-map`, `get-project-inventory` and `discover`, then `Read` them. The
   discover index can be stale: when it and `Read` disagree, `Read` wins.
3. Check the item's "Current state" against the code before you change anything. The source docs were
   written 2026-09-24 to 2026-09-26; counts and line numbers drift. When the code differs from the item,
   the code wins; say so in your report.

## How you work

- Write tests that assert real values: states, content, payloads. A test that only checks "was called"
  or "rendered" does not count.
- Do not run mutation checks (breaking the code on purpose to see a test go red). The user dropped that
  step for this epic on 2026-09-28: most of the work is swapping one call for another, and the extra
  runs cost more than they caught. Tests still assert real values.
- Fix every failure your scoped ward run shows, including ones you did not cause, as long as the failing
  file is inside your item's scope. Outside your scope, report it.
- When a design in the item does not work (a type error, a resolution failure, a Jest or Node
  disagreement), try to make it work first. If it cannot work as written, pick the cleanest design that
  does, keep it working in a consumer repo, and report it under DECISIONS so the operator can record a
  concession.
- If you are blocked, say exactly what blocks you and what you tried. Do not stop at the first error:
  explore the cause.

## Your report

End with exactly these sections, in this order:

```
CHANGED — one line per file: path, then what changed. Quote one verbatim line from each file you
  wrote, so the operator can check it.
WARD — the exact ward command you ran last, its run id, and its result.
LEFT STANDING — every failure or problem you saw and did not fix, with path and reason. "None" if none.
DECISIONS — every place you departed from the item file, and why. "None" if none.
BUILD NEEDED — the packages whose compiled output must be rebuilt before the next step. "None" if none.
DELETIONS — every file you moved to `tmp/deletions/`, one per line: original path, then why. "None" if none.
```
