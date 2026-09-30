# F107: `collect-subagent-chains-transformer` parses every group each render and discards the result

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | web |
| Found | R1-web-b |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts` parses every group with `chatEntryGroupContract` on each render and discards the result (line 220 `chatEntryGroupContract.parse(group);`). A full parse copies each `ChatEntry`, which breaks the identity that `chat-entry-list-widget` and `chat-panel-widget` rely on.

Checked 2026-09-30: still there.

## What should happen

The user must choose: build groups through the parse once where entries enter, or give the group contract a by-reference entry field.

## Where to look

`packages/web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts:220`, `chat-entry-group-contract`, `chat-entry-list-widget`, `chat-panel-widget`.

## History

Found by R1-web-b.
