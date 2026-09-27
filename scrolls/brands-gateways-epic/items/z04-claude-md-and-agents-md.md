# Z04: Every `CLAUDE.md` and `AGENTS.md`

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, "Every `CLAUDE.md` and `AGENTS.md`" (lines 437-472); `scrolls/brands-types-tests-rules.md`, package docs table (2392-2398) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | every package with a `CLAUDE.md`, plus the root `CLAUDE.md`/`AGENTS.md` and `.agents/plugins/dungeonmaster/rules/AGENTS.md` |
| Checks to run | `lint,typecheck,unit,integration` (most of these files carry no code, so most agents will see a scoped ward run report a skip — that is not a regression) |
| Split | operator splits per file, 1-3 files per agent |
| Runs alone | no (runs with Z01-Z03, Z05, Z06) |

## Why

Every `CLAUDE.md` teaches agents how to work in its package, and most still describe the pre-gateway,
pre-brands world: adapters wrapping npm packages, `/testing` import barrels, hand-written `exports`
entries, `registerMock` conventions built around adapter proxies. A model reading any of these learns
rules the code no longer enforces once this epic lands.

## Current state

Confirmed present by a repo-wide walk on 2026-09-26 (matches the source doc's own list exactly, plus the
two files it says "had no hits, but still get read"):

```
./.agents/plugins/dungeonmaster/rules/AGENTS.md
./AGENTS.md
./CLAUDE.md
./packages/CLAUDE.md
./packages/cli/CLAUDE.md
./packages/eslint-plugin/CLAUDE.md
./packages/eslint-plugin/src/brokers/rule/CLAUDE.md
./packages/hooks/CLAUDE.md
./packages/hydration-recipes/CLAUDE.md
./packages/hydration/CLAUDE.md
./packages/mcp/CLAUDE.md
./packages/orchestrator/CLAUDE.md
./packages/server/CLAUDE.md
./packages/shared/CLAUDE.md
./packages/siegelense/CLAUDE.md
./packages/testing/CLAUDE.md
./packages/ward/CLAUDE.md
./packages/web/CLAUDE.md
```

No `packages/@gateway/*/CLAUDE.md` exists — the gateway packages carry no package-level `CLAUDE.md` of
their own today; whether they need one is left to the executing agent's judgement while reading the
finished code (recommended: yes, one, since every other package has one — note the decision if skipped).

## Work

**Review every one of the 18 files above against the finished code, not only the ones the 2026-09-26
search hit.** The search was for the terms "adapters", "`/testing` imports", "`exports`", "`@types`",
"`registerMock`" and "npm package" — a term list misses what nobody thought to search for, which is
exactly why every file gets read, not just the ones with a hit.

Per-file starting point, from the source doc's own search (re-verify each against the finished code
rather than trusting this list — Phase 2/4's own work may have already changed some of these):

| File | Mentions found 2026-09-26 |
|---|---|
| `CLAUDE.md` (repo root) | adapters, `/testing`, npm packages |
| `packages/CLAUDE.md` | `exports`, root `@types/`, `registerMock`, npm packages |
| `packages/shared/CLAUDE.md` | adapters, `exports` ("Adding New Exports", gateway follow-up item 45) |
| `packages/testing/CLAUDE.md` | adapters, `/testing`, `registerMock` |
| `packages/cli/CLAUDE.md` | adapters, `/testing`, `jest.mock`, `registerMock` |
| `packages/mcp/CLAUDE.md` | adapters, `/testing`, `exports` |
| `packages/server/CLAUDE.md` | adapters, `/testing` |
| `packages/orchestrator/CLAUDE.md` | adapters |
| `packages/web/CLAUDE.md` | adapters, npm packages |
| `packages/ward/CLAUDE.md` | adapters, `@types` |
| `packages/hydration/CLAUDE.md` | adapters, `exports` |
| `packages/hydration-recipes/CLAUDE.md` | adapters, `exports` |
| `packages/eslint-plugin/CLAUDE.md` | adapters, `@types`, npm packages |
| `packages/eslint-plugin/src/brokers/rule/CLAUDE.md` | adapters, `/testing`, `registerMock` |
| `.agents/plugins/dungeonmaster/rules/AGENTS.md` | adapters, `exports`, `jest.mock`, `registerMock` |
| `packages/hooks/CLAUDE.md` | none found by search — still read |
| `packages/siegelense/CLAUDE.md` | none found by search — still read |
| `AGENTS.md` (root) | none found by search — still read |

For `packages/eslint-plugin/src/brokers/rule/CLAUDE.md` specifically, apply this exact rewrite (source doc
row, table at line 2392):

| Says today | Change to |
|---|---|
| "Use the shared Tsestree contract." | "Import `TSESTree` from `#gateway/npm/typescript-eslint__utils`. Never copy it." |
| "All AST nodes in rule brokers must use `Tsestree` type." | "AST nodes in rule brokers use the library's `TSESTree` types." |
| `const node = TsestreeStub({type: TsestreeNodeType.Program});` | `const node = ProgramStub({ code: '…' });`, imported from `#gateway/npm/typescript-eslint__utils/program/program.stub` per this epic's concession 1 |

**`.agents/plugins/dungeonmaster/rules/AGENTS.md` sits under a folder `init` writes for Antigravity.** If
`init` generates it (check `packages/cli/src/startup/start-install.ts` or whichever package's install
script writes it), **change the generator, not the file** — per this repo's own `CLAUDE.md`,
"Regenerating `.claude/settings.json` Here": `npm run build`, `npm link --workspaces`, `npm run init`.
This last step is **operator-only** — a dispatched agent for this item edits the generator source and
reports what changed; it does not run `init` itself (agents never build or run scripts that install
config, per `agent-brief.md`'s "What you never do").

**The session snippets in `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` get
the same review** — they reach every agent in every consumer repo. Coordinate with Z02, which already
owns specific rows in that file; do not duplicate edits. If this item's broader read finds a snippet row
Z02 did not cover, fix it here and note the overlap under DECISIONS.

**`create-package` should refuse, or handle, a name under `packages/@gateway/`** — this is named in the
source doc as part of "Docs and teaching text to update" but is really a code change
(`packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.ts` or
wherever `create-package` lives). If found still open while reading `packages/CLAUDE.md`'s "Creating New
Packages" section, report it under LEFT STANDING rather than fixing it inline — it is outside this
item's doc-only scope.

## Lint rules this item adds or changes

None.

## Teaching text this item changes

All 18 files listed above, reviewed and rewritten where they still teach the pre-epic world.

## Done when

- Every file in the 18-file list has been read against the finished code (not just the ones with a
  2026-09-26 search hit).
- Every mention of `adapters/` as a folder type, `/testing` import barrels, hand-written per-folder
  `exports` entries, and pre-B1-B9 brand rules is updated or removed.
- `packages/eslint-plugin/src/brokers/rule/CLAUDE.md`'s three specific rewrites above are applied.
- `.agents/plugins/dungeonmaster/rules/AGENTS.md` is fixed at its generator, never hand-edited, if `init`
  generates it — or edited directly with a note if it turns out to be hand-maintained.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- `.agents/plugins/dungeonmaster/rules/AGENTS.md` may be a **generated, gated file** per this repo's own
  `<dungeonmaster-generatedConfig>` rule — hand-editing it risks the next `dungeonmaster init` silently
  overwriting the edit. Confirm which it is before touching it.
- Split 1-3 files per agent, per the epic's own dispatch rule — do not hand one agent all 18.
- Coordinate with Z02 on `session-snippet-statics.ts` so the same row is not rewritten twice with
  different wording.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
