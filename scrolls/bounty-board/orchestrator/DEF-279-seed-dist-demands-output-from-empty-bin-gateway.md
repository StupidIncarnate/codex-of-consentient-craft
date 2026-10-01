# DEF-279: `create-worktree` demands compiled output from a package whose build emits nothing

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a consumer must create an empty `dist/` folder by hand before a worktree can be made |
| Package | orchestrator |
| Found | 2026-09-30, from assayer, a consumer that links dungeonmaster through `file:` |
| Moved from | assayer `scrolls/brands-gateways-epic/EPIC.md`, "Upstream reports" item 7, 2026-10-01 |

## What is wrong

`worktreeSeedDistBroker` refuses to make a worktree when any package in the main checkout has no `dist/` folder
(`worktree-seed-dist-broker.ts:101-115`). It says the main checkout "has no compiled output" and asks for a build.

A fresh `packages/@gateway/bin` that `init` writes holds only the placeholder `src/index.d.ts`. Its build emits no file,
so no `dist/` folder appears. The seed step can then never pass, however often the user builds. An empty `dist/`
folder made by hand gets past it.

## What should happen

The seed step tells "never built" apart from "built, and the build emits nothing". One way: skip a package whose build
input holds only declaration files. Another: have the gateway package's build always create `dist/`. A test covers a
package that holds only `src/index.d.ts`.

## Where to look

- `packages/orchestrator/src/brokers/worktree/seed-dist/worktree-seed-dist-broker.ts:84-115`
- The `bin` gateway template `init` writes, in `packages/cli` (`gateway-package-template-statics.ts`)

## History

Assayer upstream report 7.
