# G04: Delete the hand-written MCP SDK type declarations

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 12, lines 77-85; `packages/CLAUDE.md`, "Type Definitions" / "Root `@types/` folder" |
| Needs | nothing |
| Unblocks | nothing named in EPIC.md's table |
| Packages touched | `@gateway/npm`, `mcp` |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

`packages/@gateway/npm/@types/modelcontextprotocol-sdk.d.ts` hand-writes ambient type declarations for
part of the `@modelcontextprotocol/sdk` package. Its own header comment says it copies
`packages/mcp/@types/modelcontextprotocol.d.ts`, and both exist for the same reason: the SDK's
`package.json` `exports` map has no legacy `main`/`types` field, so `moduleResolution: "node"` (node10
resolution) could not find its subpath declarations at all.

This repo's root tsconfig now resolves with `moduleResolution: "node16"`, which DOES read the SDK's
`exports` map — so both hand-written copies may now be deletable. Keeping a hand-written copy of a large
type tree breaks the gateway design doc's requirement 3, "Nobody copies a large type tree", and a
per-package `@types/` folder (the gateway npm package's copy) also breaks `packages/CLAUDE.md`'s
"Root `@types/` folder" rule: type definitions for packages without their own `@types` npm package go in
the ROOT `@types/` directory, never inside an individual package.

## Current state

Checked 2026-09-26 against the code:

- `packages/@gateway/npm/@types/modelcontextprotocol-sdk.d.ts` exists. Its header:
  ```
  // The SDK's package.json exports only an ESM/CJS conditional map with no legacy `main`/`types`
  // field, so node10 module resolution (this repo's `moduleResolution: "node"`) cannot find its
  // subpath declarations at all — confirmed with `tsc --traceResolution`, and already worked around
  // the same way in packages/mcp/@types/modelcontextprotocol.d.ts for the same three subpaths.
  ```
  It declares ambient modules for `@modelcontextprotocol/sdk/server` (and presumably two more subpaths,
  matching "the same three subpaths" the header names — the other two were not read in this pass).
- `packages/mcp/@types/modelcontextprotocol.d.ts` exists, confirmed by `find`.
- The root `tsconfig.json` (repo root) sets `"module": "node16"`, `"moduleResolution": "node16"`, and
  `"customConditions": ["source"]` — confirmed by reading the file. This is the resolution mode the
  source doc says should now read the SDK's real `exports` map, making both hand-written files
  unnecessary.
- `packages/@gateway/npm/tsconfig.json` and `packages/mcp/tsconfig.json` both `extends` the root
  tsconfig and add their own `typeRoots` including a package-local `./@types`. Deleting the `.d.ts` files
  does not by itself require touching `typeRoots` — an empty or absent `@types` folder under `typeRoots`
  is harmless — but if the folder becomes fully empty after deleting its one file, remove the empty
  folder too (a folder with nothing in it is clutter, not a real `@types` package).
- Not checked: whether the real `@modelcontextprotocol/sdk` package, once resolved through its own
  `exports`, actually types every member the hand-written declarations added members for (`ServerOptions`,
  `ServerInfo`, and whatever else). This item's whole risk is exactly that gap, so the typecheck in Work
  step 2 is not optional.

## Work

1. Delete `packages/@gateway/npm/@types/modelcontextprotocol-sdk.d.ts` and
   `packages/mcp/@types/modelcontextprotocol.d.ts`. If either package's `@types/` folder is empty
   afterward, delete the empty folder too.
2. Typecheck both packages and everything that imports `@modelcontextprotocol/sdk` through the gateway or
   directly in `mcp`: `npm run ward -- --only typecheck -- packages/@gateway/npm packages/mcp`. A
   `TS2307` or a missing-member error here means the real SDK's `exports` map does not expose everything
   the hand-written file declared — in that case, do NOT re-create the hand-written file. Instead find
   which subpath or member is actually missing and either import it from a subpath the SDK really
   exports, or report the specific gap under LEFT STANDING / DECISIONS rather than silently reintroducing
   a copy.
3. If the typecheck passes clean, also run `lint` and `unit` for both packages, since deleting a file
   can shift what a barrel or a colocation rule expects to find.
4. Update anything that references either deleted file by path (a comment, a barrel, a `typeRoots` entry
   naming the specific file) — search with `discover` before assuming there are none.

## Done when

- [ ] `packages/@gateway/npm/@types/modelcontextprotocol-sdk.d.ts` is gone.
- [ ] `packages/mcp/@types/modelcontextprotocol.d.ts` is gone.
- [ ] `npm run ward -- --only typecheck,lint,unit -- packages/@gateway/npm packages/mcp` exits 0.
- [ ] If either delete could not be made clean (a real typecheck gap), the report says exactly which
  member or subpath is missing from the real SDK's resolved types, under LEFT STANDING or DECISIONS —
  not a silently restored hand-written file.

## Traps

- Do not assume `node16` resolution definitely covers every member the hand-written files declared —
  the source doc says "may be deletable", not "is definitely deletable". The typecheck is the actual
  test; read its output rather than assuming success.
- `packages/CLAUDE.md`'s root-`@types/`-folder rule stays true for every OTHER package without its own
  `@types` npm package — this item does not change that rule, it only removes one violation of it (the
  gateway npm package's own `@types/` folder) once the real fix (SDK's own `exports` resolving) makes
  the copy unnecessary.

## Concessions made while executing
