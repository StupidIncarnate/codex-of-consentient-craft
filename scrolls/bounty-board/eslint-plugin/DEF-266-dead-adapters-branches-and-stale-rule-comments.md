# DEF-266: Lint code keeps dead `/adapters/` branches, and config comments say on-rules are off

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | eslint-plugin |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

Dead branches for a folder that no longer exists:

- `packages/eslint-plugin/src/guards/is-io-boundary-proxy/is-io-boundary-proxy-guard.ts:26` — `if (filename.includes('/adapters/')) {`
- `packages/eslint-plugin/src/statics/no-bare-process-cwd/no-bare-process-cwd-statics.ts:17` — `allowedFolders: ['**/src/adapters/process/cwd/**', '**/packages/@gateway/node/src/process/**'],`
- `validate-adapter-mock-setup-layer-broker`, which validates adapter mock setup
- a branch in `dungeonmaster-rule-enforce-on.integration.test`

Stale comments in the config: above `'@dungeonmaster/raw-import-ban'`, `platform-globals-ban` and `bin-program-spawn-ban` (`config-dungeonmaster-broker.ts:179-183`), comments still say the rule "turns on once callers migrate". All three are at `'error'`.

## What should happen

Delete the adapter branches and the adapter entry, with their test cases. Delete `validate-adapter-mock-setup` if nothing else uses it. Rewrite the three comments to say why each rule exists, or delete them.

## Where to look

The files above, all in `packages/eslint-plugin/src/`.

## History

Found by the 2026-09-30 checks of the "Delete every adapter" section and item 29.
