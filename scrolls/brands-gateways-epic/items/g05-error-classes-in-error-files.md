# G05: Error classes live in `.error.ts` files, not their own folder

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 10, lines 33-75 |
| Needs | nothing |
| Unblocks | [G14](g14-gateway-barrel-lint-rules.md); every Phase 2 adapter item that lists G05 in its Needs: [A04](a04-adapters-cli.md), [A05](a05-adapters-config.md), [A06](a06-adapters-eslint-plugin.md), [A07](a07-adapters-hooks.md), [A08](a08-adapters-hydration.md), [A09](a09-adapters-mcp.md), [A10](a10-adapters-orchestrator.md), [A11](a11-adapters-server.md), [A12](a12-adapters-shared.md), [A13](a13-adapters-siegelense.md), [A15](a15-adapters-tooling.md), [A16](a16-adapters-ward.md), [A17](a17-adapters-web.md) |
| Packages touched | `@gateway/bin`, `@gateway/node`, `eslint-plugin` (the `gateway-colocation` rule) |
| Checks to run | `lint,typecheck,unit` |
| Split | operator splits by package: one agent for `@gateway/bin` (six error folders — a batch of 3 then a batch of 3 works, since each move touches only that one folder plus the subpath barrel and its callers), one agent for `@gateway/node` (one error folder) plus the `lsof-run` addition, one agent for the `gateway-colocation` rule change in `eslint-plugin` |
| Runs alone | only within `@gateway/bin` and `@gateway/node` — EPIC.md restricts other Phase 1 items from touching those two packages while this one runs; elsewhere any other item may run at the same time |

## Why

Every gateway error class sits in a wrapper folder of its own, with a proxy and a test, even though the
class body is one line, such as `export class GitNotInstalledError extends Error {}` — so the proxy and
the test check nothing real. Today's error folders:

| Error folder | Thrown by |
|---|---|
| `bin/src/git/git-not-installed-error/` | `git/git-run/git-run.ts` |
| `bin/src/npm/npm-not-installed-error/` | `npm/npm-run/npm-run.ts` |
| `bin/src/kill/kill-not-installed-error/` | `kill/kill-run/kill-run.ts` |
| `bin/src/cp/cp-not-installed-error/` | `cp/cp-run/cp-run.ts` |
| `bin/src/lsof/lsof-not-installed-error/` | `lsof/listening-pids/listening-pids.ts` |
| `bin/src/claude/claude-not-installed-error/` | `claude/resolve-claude-cli-path/resolve-claude-cli-path.ts` |
| `node/src/child_process/run-not-found-error/` | `run`, `run-sync`, `stream` and `stream-lines` in `node/src/child_process/` |

## Current state

Checked 2026-09-26 against the code — every folder in the table above exists exactly as described, each
holding a `.ts`, a `.test.ts` and a `.proxy.ts` (confirmed by `ls` on all seven folders):

- `bin/src/git/git-not-installed-error/`: `git-not-installed-error.ts`, `.test.ts`, `.proxy.ts`
- `bin/src/npm/npm-not-installed-error/`: same three files
- `bin/src/kill/kill-not-installed-error/`: same three files
- `bin/src/cp/cp-not-installed-error/`: same three files
- `bin/src/lsof/lsof-not-installed-error/`: same three files
- `bin/src/claude/claude-not-installed-error/`: same three files
- `node/src/child_process/run-not-found-error/`: same three files

The `gateway-colocation` ESLint rule lives at
`packages/eslint-plugin/src/brokers/rule/gateway-colocation/rule-gateway-colocation-broker.ts` (confirmed
by `discover`). Not read in full in this pass — the executing agent reads it before changing it, since
Work step 1 needs its exact dot-counting logic.

**The "still open" question, read directly from the code:** `git-run.ts` (the pattern to copy) is:
```ts
export const gitRun = async ({ args, cwd }: { args: string[]; cwd: string }): Promise<{...}> => {
  try {
    return await run({ command: 'git', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new GitNotInstalledError(`git ${args.join(' ')} could not start in ${cwd}: ${error.message}`);
    }
    throw error;
  }
};
```
`npm-run.ts`, `kill-run.ts` and `cp-run.ts` follow the identical shape (not individually re-read in this
pass, but named as the same pattern by the source doc and by `bin/src/*/**-run/` existing as a folder
alongside each `-not-installed-error/` folder — confirmed `bin/src/npm/npm-run`, `bin/src/kill/kill-run`,
`bin/src/cp/cp-run` all exist).

`lsof` has NO `lsof-run` folder (confirmed: `ls packages/@gateway/bin/src/lsof/` shows only
`listening-pids/`, `lsof-not-installed-error/`, and the subpath's own `lsof.ts`/`.proxy.ts`/`.test.ts` —
no `lsof-run/`). Instead, `listening-pids.ts` catches `RunNotFoundError` INLINE:
```ts
export const listeningPids = async ({ port }: { port: number }): Promise<number[]> => {
  const result = await run({ command: 'lsof', args: ['-ti', `:${String(port)}`], cwd: CWD }).catch(
    (error: unknown) => {
      if (error instanceof RunNotFoundError) {
        throw new LsofNotInstalledError(`lsof -ti :${String(port)} could not start: ${error.message}`);
      }
      throw error;
    },
  );
  ...
};
```
So today there are genuinely two patterns in the same package with no rule saying which a new program
should copy.

`claude`'s case is a third shape, not directly comparable: `resolve-claude-cli-path.ts` does not call
`run`/`RunNotFoundError` at all — it resolves a CLI path through an env override, an installed npm
package's `bin` field, or a `PATH` scan, and throws `ClaudeNotInstalledError` when none of the three
resolves. It has no `run()` call to wrap, so it is not a candidate for a `claude-run` wrapper in the same
sense as the other four. Leave it as-is; this item's `<program>-run` recommendation is about the
`git`/`npm`/`kill`/`cp`/`lsof` family that all wrap a single `run()` call, not about `claude`.

## Work

1. **Change `gateway-colocation` to accept `.error.ts` files.** Read the rule's source first — it counts
   dots in a filename to tell a barrel (`{subpath}.ts`) from a wrapper file, so a two-dot name
   (`git-not-installed.error.ts`) needs its own case. The rule must:
   - Not require a proxy or a test for an `.error.ts` file.
   - Refuse an `.error.ts` file that holds anything besides one exported class extending `Error`, or
     whose class name does not match the file name (`git-not-installed.error.ts` must export exactly
     `GitNotInstalledError` and nothing else).
2. **Refuse an error class declared in any other gateway file**, so every future error class is forced
   into an `.error.ts` file from the start. This is a second check on the same rule (or a sibling rule —
   the executing agent decides which, and says so in DECISIONS), catching a `class X extends Error {}`
   declared inside a wrapper's own `.ts` file.
3. **Move the seven error classes in the table above.** For each:
   - Create `<name>.error.ts` in the folder of the wrapper that throws it: e.g.
     `bin/src/git/git-run/git-not-installed.error.ts` (note: moves INTO the `git-run/` folder, beside
     the wrapper, not left in its own `git-not-installed-error/` folder). For `run-not-found-error`,
     which several wrappers in `node/src/child_process/` throw, it sits in the SUBPATH folder beside the
     barrel: `node/src/child_process/run-not-found.error.ts` — not inside any one wrapper's folder.
   - Delete the old `<name>-error/` folder: its `.ts`, `.test.ts` and `.proxy.ts`.
   - Fix the subpath barrel's re-export so callers still reach the class as `#gateway/bin/git`'s
     `GitNotInstalledError` (or `#gateway/node/child_process`'s `RunNotFoundError`) — unchanged from a
     caller's point of view.
   - Fix every import of the OLD path (`.../git-not-installed-error/git-not-installed-error`) across the
     repo. Use `discover` to find every importer before assuming the barrel re-export is the only place
     that needs a fix — a caller could theoretically import the error class's old path directly, bypassing
     the barrel, and that import breaks silently at typecheck, not at lint.
4. **Add `.error.ts` to the barrel rules** under "Lint rules that keep the layout honest" (the barrel
   must be allowed to re-export an `.error.ts` file's class the same way it re-exports a wrapper's named
   function), and to the layout row of the `gateway` folder-type doc. The folder-type doc itself is
   Z01's job (Phase 6) — this item only needs to make sure the BARREL LINT RULE (not the doc) already
   treats `.error.ts` as a valid re-export source, since G14 (barrel lint rules) depends on this item.
5. **Resolve the lsof question. Recommended:** every program that wraps a single `run()` call in `bin`
   gets its own `<program>-run` wrapper that catches `RunNotFoundError` and re-throws the program's own
   `NotInstalledError` — the exact shape `gitRun`/`npmRun`/`killRun`/`cpRun` already share. So:
   - Add `bin/src/lsof/lsof-run/lsof-run.ts`, copying the `gitRun` pattern: it takes `{ args, cwd }`,
     calls `run({ command: 'lsof', args, cwd })`, and re-throws `RunNotFoundError` as
     `LsofNotInstalledError`.
   - Change `listeningPids` to call `lsofRun` instead of calling `run` and catching inline — it keeps its
     own "exit non-zero, empty output means nothing listening" logic (that part is unique to `lsof` and
     stays in `listening-pids.ts`), but delegates the "did the binary even start" question to `lsofRun`.
   - This is **Recommended — the executing agent may change it with a reason in DECISIONS** if, once
     written, `lsofRun`'s signature does not actually fit `listeningPids`'s call shape (e.g. if
     `listeningPids` needs the raw `run()` result's `exitCode` in a way `lsofRun` would have to thread
     through anyway, making the wrapper pure overhead rather than real reuse).
   - `claude` is explicitly OUT of scope for this pattern (see Current State) — do not add a `claude-run`
     wrapper as part of this decision.

## Lint rules this item adds or changes

- **`gateway-colocation`** (existing rule, changed): accepts `.error.ts` files without requiring a proxy
  or a test; refuses one that exports more than one thing or whose class name mismatches its file name.
  Not tagged `'pre-edit'` by this item — check whether it already carries that tag today, and if changing
  its logic risks breaking the pre-edit-safety conditions (reads only the file being edited, needs no
  type checker, the file being edited can fix the violation — see the brands doc's rule for what makes a
  rule pre-edit-eligible), keep its existing tag as-is unless the change breaks one of the three
  conditions.
- A **second check** (same rule or a sibling — DECISIONS records which): refuses an error class declared
  outside an `.error.ts` file. Same pre-edit consideration as above.

## Done when

- [ ] `gateway-colocation` accepts `.error.ts` files with no proxy/test requirement, and refuses a
  malformed one (wrong export count, mismatched class name).
- [ ] A rule (new or extended) refuses an error class declared anywhere else in the gateway.
- [ ] All seven error classes from the table are moved into `.error.ts` files beside the wrapper(s) that
  throw them; the seven old `-error/` folders (with their `.test.ts` and `.proxy.ts`) are deleted.
- [ ] Every barrel re-export and every caller import of the old paths is fixed — confirmed by a
  typecheck across `@gateway/bin` and `@gateway/node` and everything that imports from either.
- [ ] `bin/src/lsof/lsof-run/lsof-run.ts` exists and `listeningPids` calls it (or DECISIONS records why
  not).
- [ ] `npm run ward -- -- packages/@gateway/bin packages/@gateway/node packages/eslint-plugin/src/brokers/rule/gateway-colocation` (`lint,typecheck,unit`) exits 0.

## Traps

- Don't leave a stray empty `-not-installed-error/` folder behind after deleting its contents.
- `claude-not-installed-error` moves into an `.error.ts` file the same as the other six (Work step 3
  covers all seven), even though `claude`'s THROWING file doesn't fit the `<program>-run` pattern (Work
  step 5) — those are two separate parts of this item. Don't skip moving `claude`'s error file just
  because it has no `-run` wrapper to add.
- `run-not-found.error.ts` is the one case that sits at the SUBPATH level, not inside one wrapper's
  folder — because four different wrappers in `node/src/child_process/` throw it. Don't put it inside
  just one of the four wrappers' folders.

## Concessions made while executing
