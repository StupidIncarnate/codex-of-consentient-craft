# DEF-263: Several CLAUDE.md files still name adapters by their old names

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

These files mention adapters by name only. Each name may point at nothing now:

| File | Names |
|---|---|
| `CLAUDE.md` (repo root) `:75`, `:104` | `netFreePortPairAdapter` |
| `packages/orchestrator/CLAUDE.md` `:1111`, `:1112`, `:1512` | `gitVerifyRefAdapter`, `gitCurrentBranchAdapter`, `gitHeadShaAdapter` |
| `packages/ward/CLAUDE.md` `:410-411`, `:433` | `childProcessSpawnCaptureAdapter`; "the `ink` adapter" |
| `packages/hydration-recipes/CLAUDE.md` `:60`, `:82`, `:83`, `:87` | `dmHttpRequestAdapter`, `dmHttpResponseUnwrapAdapter`, "second unwrap adapter" |
| `packages/web/CLAUDE.md` `:615-649` | "the elk adapter", `node-measure-layer-adapter.ts` |
| `packages/hydration/CLAUDE.md` `:197-201` | correct content, but its heading still says "adapters" |

The root `CLAUDE.md` is this repo's own file, so its env-var and e2e sections should name the real port broker or wrapper.

## What should happen

Each name becomes the thing that exists today, found with `discover`. A web name ending `-layer-adapter` may be a real file whose name was never changed; check it before renaming anything.

## Where to look

The files and lines in the table.

## History

Found by the 2026-09-30 check. The gateway follow-up doc listed these files for review on 2026-09-26. The session snippets and `.agents/plugins/dungeonmaster/rules/AGENTS.md` came back clean.
