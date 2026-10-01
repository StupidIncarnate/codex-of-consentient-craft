# F107: `collect-subagent-chains-transformer` parses every group each render and discards the result

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | web |
| Found | R1-web-b |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts` parses every group with `chatEntryGroupContract` on each render and discards the result (line 220 `chatEntryGroupContract.parse(group);`). A full parse copies each `ChatEntry`, which breaks the identity that `chat-entry-list-widget` and `chat-panel-widget` rely on.

Checked 2026-09-30: still there.

## What should happen

**Decided by the user, 2026-09-30: move the check into a unit test.**

1. Delete the loop at the end of `collectSubagentChainsTransformer` (`chatEntryGroupContract.parse(group)` over every group, result discarded) and its comment.
2. In `collect-subagent-chains-transformer.test.ts`, add a test that runs the grouping on realistic chats (plain messages, nested sub-agents, task notifications, a trailing unfinished chain) and asserts every output group passes `chatEntryGroupContract.parse`, using `toStrictEqual` on the parse result against the group.

**No caching is needed.** Every message is already validated once when it arrives: `use-quest-chat-binding.ts:369` and `use-session-replay-binding.ts:75` `safeParse` each WebSocket entry, and locally made entries are built through `chatEntryContract.parse`. The re-check only guarded against a grouping bug, which the test now catches. `chat-entry-list-widget.tsx:96` still regroups on every render without a memo, but nearly every render is a new entry arriving, which needs regrouping anyway; a memo would only save the 60-second `now` tick and toggle clicks.

## Where to look

`packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts:220`, `chat-entry-group-contract`, `chat-entry-list-widget`, `chat-panel-widget`.

## History

Found by R1-web-b.
