# DEF-273: The Jest global teardown fails a run when another Claude session starts during it

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: concurrent sessions fail each other's test runs |
| Package | testing |
| Found | 2026-10-01, from assayer, a consumer that links dungeonmaster through `file:` (assayer item PE-10, ward run `1790897042784-6bda`) |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Post-epic work", paragraph "Upstream finding", 2026-10-01 |

## What is wrong

`packages/testing/src/jest.setup-global-teardown.js` lists `~/.claude/projects` after the run and compares it with the
list `jest.setup-global.js` took before the run. It fails the run for any new folder whose name starts with the
encoded OS tmp path (lines 52-66). It cannot tell which process made the folder.

Another Claude Code session that starts during the run, with its working folder under the OS tmp folder, makes exactly
such a folder. Assayer's run `1790897042784-6bda` failed with:

```
jest.setup-global-teardown: 1 new directory appeared under the REAL /home/brutus-home/.claude/projects during this run
— the HOME sandbox did not hold: -tmp-claude-1001--home-brutus-home-projects-codex-of-consentient-craft-56f7d8b9-9e98-4e30-9b95-45309bd206ef-scratchpad-proj
```

That folder belongs to a different Claude session's scratchpad, not to the test run. Every test passed, and the run
still failed. Agents that work in parallel on one machine fail each other's test runs this way.

## What should happen

The leak check fails a run only for a folder this run made. Two ways to get there:

- Every process the run starts gets a working folder under a per-run prefix (for example the sandbox's own pid), and
  the check matches only that prefix.
- The check matches only folder names built from the folders this run's tests create, not every tmp folder.

A test starts a second process that creates a tmp-encoded folder under the real projects folder during a run, and the
teardown does not fail.

## Where to look

- `packages/testing/src/jest.setup-global-teardown.js:52` (the tmp prefix), `:54-58` (the filter), `:60-66` (the throw)
- `packages/testing/src/jest.setup-global.js:87-99` (the "before" list)

## History

Found by assayer's PE-10 run. DEF-272 is the other defect in the same teardown file.
