# F132: two guild responder proxies hand-make failures, and `ban-invented-failures` scans 0 of them

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: `ban-invented-failures` scans 0 files, so the rule silently checks nothing |
| Package | server |
| Found | Z03-E4 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/server/src/responders/guild/get/guild-get-responder.proxy.ts:19` (`orchestrator.getGuildThrows({ guildId, error: new Error(message) });`) and `packages/server/src/responders/guild/add/guild-add-responder.proxy.ts:29` (`orchestrator.addGuildThrows({ name, path, error: new Error(message) });`) pass `error: new Error(message)` into the orchestrator proxy. T05 forbids a hand-made failure. `ban-invented-failures` scans 0 files, so it does not catch them.

## What should happen

Find out why the rule misses these two and fix it. Then fix both proxies.

## Where to look

The two proxy files above; the `ban-invented-failures` rule in `packages/eslint-plugin`.

## History

Found by Z03-E4. Priority P2. Checked 2026-09-30: both lines still there.
