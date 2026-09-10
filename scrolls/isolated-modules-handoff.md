# Turning on ts-jest `isolatedModules`

Measured 3.2x less CPU on a cold whole-repo unit sweep. Fourteen files change and one of them is real
code. Everything here was run and verified in the worktree branch
`isolated-modules-experiment`; the diff on that branch IS the change, so `git cherry-pick` or
`git diff master..isolated-modules-experiment` beats retyping it.

## Why

ts-jest builds a full TypeScript **Program** — every file in the package resolved and typed — to
compile each test file. `isolatedModules: true` switches it to `ts.transpileModule`: strip the types
off one file, emit, never look at another file.

That cost is paid **once per jest worker per package**, so it grew when ward started running workers.

Measured, whole-repo `--only unit`, private cold caches, 2702 files green both sides:

| | CPU | wall |
|---|---|---|
| off | 2950.50s | 359.3s |
| on | 929.80s | 118.9s |

Trust the CPU column. The two runs met different machine load, which moves wall time and not user CPU.

Single package (`mcp`, 176 files), private cold caches: CPU 162.96s -> 47.18s cold, 38.18s -> 22.09s warm.

## The one blocker, and why the fix is one character

`packages/testing/ts-jest/proxy-mock-transformer.js` hoists `jest.mock()` calls out of `.proxy.ts`
files, and reads those files' syntax trees off the Program. In `ts-jest/dist/legacy/compiler/ts-compiler.js`
the line creating the Program sits inside `if (!this.configSet.isolatedModules)`, so with the flag on
`program` is `undefined` and the hoisting silently stops — tests keep compiling and start failing in
ways that point nowhere near the config.

**The parse-from-disk path already existed.** `typescript-source-file-getter-adapter.ts` falls back to
`ts.createSourceFile(fs.readFileSync(...))` for cross-package proxy files, and that produces exactly
what the Program would: a full AST. Nothing in the chain ever calls `getTypeChecker` — `getSourceFile`
is the only Program access in the whole package. The fallback just needed to be reachable when there
is no Program:

```ts
// packages/testing/src/adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.ts
const fromProgram = (program as unknown as ts.Program | undefined)?.getSourceFile(filePath);
```

No cache was needed. The measured win above is without one.

## What to change

**1. The guard above.** This is the only non-config edit, and nothing else works without it.

**2. `isolatedModules: true` in every jest ts-jest transform.** Twelve packages override the base
`transform`, so patching only `jest.config.base.js` reaches just `server` and `shared`, which inherit it.

| Where | Shape |
|---|---|
| `jest.config.base.js` | add to the inline `tsconfig` object — covers `server` and `shared` |
| `cli`, `config`, `eslint-plugin`, `hooks`, `local-eslint`, `mcp`, `orchestrator`, `testing`, `tooling` | add one line to the inline `tsconfig` object |
| `session-forensics`, `ward` | same, but their `tsconfig` is written on ONE line, so it reformats to multi-line |
| `web` | points at a tsconfig FILE — add `"isolatedModules": true` to `packages/web/tsconfig.test.json`, not to the jest config |

## What it costs, and it is exactly one thing

ts-jest no longer type-checks while transforming, so **`--only unit` stops catching type errors.**
Nothing else changes.

| Command | before | after |
|---|---|---|
| `npm run ward` (full) | fails | **fails** |
| `npm run ward -- -- file.test.ts` | fails | **fails** |
| `npm run ward -- --only lint,typecheck,unit -- files` | fails | **fails** |
| `npm run ward -- --only unit -- file.test.ts` | fails | **PASSES** |

Ward's `typecheck` still grades every test file, and all fourteen packages' CHECKING tsconfigs
(`tsconfig.json`, not `tsconfig.build.json`) include their test files, so none escape. Typecheck also
ignores file scope — it graded 77 files for a one-file run — so it cannot be narrowed away by accident.

Worth a line in `packages/ward/CLAUDE.md` telling anyone iterating with `--only unit` that types are
not being checked there.

## Verification that was actually run

- **Negative control.** Broke the fallback on purpose (return `undefined` after parsing) and re-ran
  `mcp`: **51 of 176 files failed, 242 errors.** That path is genuinely what hoists the mocks; it is
  not decoration.
- **Full ward on the branch: all green.** 7698 lint, 7676 typecheck, 2702 unit, 126 integration,
  111 e2e.
- **Type errors still caught by a full run.** Injected `TS2339` into a test file in `shared` (inherits
  the base transform) and one in `web` (own tsconfig file). Full ward: `typecheck: FAIL … 2 files
  failed`, both named with file and line, `unit: PASS` all 2702, **ward exit code 1**. Both reverted.

## Gotchas for whoever lands it

- **Re-run the full ward in the target checkout.** These numbers come from a worktree; do not trust
  the transfer.
- **`packages/web` is the odd one out** — its jest config names a tsconfig file, so a search-and-replace
  over jest configs misses it entirely and web silently keeps the old behaviour.
- **A flake to expect, unrelated to this change.** `packages/cli/bin/cli-entry.integration.test.ts`
  spawns the real `dungeonmaster` binary and races the 30s integration timeout. It timed out once here
  under concurrent e2e load and passed alone in 7.6s. If it is the only red, re-run before believing it.
- **Do not reach for `diagnostics: false` as a cheaper version of this.** Measured on `packages/config`
  against a private cold cache at 51.30s vs 49.58s user CPU — 3.4%, and nothing at all warm, because a
  warm transform cache skips ts-jest entirely. It only skips `getSemanticDiagnostics`; the Program is
  what costs, and it stays.
- **Compatibility was checked**: no `const enum` anywhere in the repo, and the architecture already
  mandates `export type {Foo}` — which is what `isolatedModules` requires.
