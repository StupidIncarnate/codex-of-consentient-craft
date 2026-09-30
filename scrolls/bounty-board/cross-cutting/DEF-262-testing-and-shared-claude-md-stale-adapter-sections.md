# DEF-262: `testing` and `shared` CLAUDE.md files keep whole sections about adapters

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

- `packages/testing/CLAUDE.md:23-37`, "### Path adapter proxies: real passthrough via `requireActual`". It cites `packages/shared/src/adapters/path/{join,dirname,basename}`, which is gone. At `:31` it shows `handle.calledWith([]).implement(…)`, a catch-all on a function that takes arguments, which the proxy rules now ban.
- `packages/shared/CLAUDE.md:67-73`, "## Streaming Adapters: the output callback is REQUIRED, never optional". It names `childProcessSpawnStreamLinesAdapter` and says "Any future adapter…".
- `packages/shared/CLAUDE.md:101` — "`startPath` is a `FilePath` (typically `processCwdAdapter()`)."

## What should happen

Rewrite each section against today's code. The rule in the streaming section (the line callback is required) may still hold for the gateway wrapper that replaced the adapter. Keep the rule and name the real wrapper. Delete whatever no longer applies.

## Where to look

- `packages/testing/CLAUDE.md`
- `packages/shared/CLAUDE.md`
- Find the replacements under `packages/@gateway/node/src/path/`, `child_process/` and `process/`

## History

Listed in the gateway follow-up doc's CLAUDE.md table on 2026-09-26. Still stale on 2026-09-30.
