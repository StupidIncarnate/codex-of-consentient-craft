# DEF-210: `dungeonmaster init` never rewrites an existing `dungeonmaster` entry in `.mcp.json`, so this repo's copy is stale

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | mcp |
| Found | 2026-09-30, walkthrough cases IN-16, IN-17, IN-19 (confirmed by reading both files) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "IN-16, IN-17", and `scrolls/walkthrough/features/08-init-prompts-and-mcp.md`, "Known open items" items 1 and 2; 2026-09-30 |

## What is wrong

Confirmed. `.mcp.json:8` still runs the old hard-coded `bash -c "DUNGEONMASTER_HOME=... exec node packages/mcp/dist/src/index.js"`.
`mcp-server-statics.ts:15-16` (`resolveScript`) defines the current generic `require('@dungeonmaster/mcp')` form with a global fallback;
`.agents/plugins/dungeonmaster/mcp_config.json` is rewritten on every init and already carries it.
`install-config-create-responder.ts:48-56` returns `action: 'skipped'` whenever a `dungeonmaster` key exists in `mcpServers`, so a stale entry never updates.

Related: the root `CLAUDE.md` "Four Resolution Scenarios" says Scenario 1 (dogfood) runs `packages/mcp/dist/src/index.js`. That is true of the stale file only.
The new generator is one script for all four scenarios. Whether it still resolves to THIS checkout's `dist/` is unchecked (IN-16 to IN-19).

## What should happen

The user decides whether init may overwrite an existing entry (it could clobber a hand-edited one). Options: rewrite an entry that matches a known old form;
or always rewrite the `dungeonmaster` key. Then check that the new form resolves to this checkout in scenarios 1 and 2, and make the root `CLAUDE.md` table match.

## Where to look

- `.mcp.json:8`
- `packages/mcp/src/statics/mcp-server/mcp-server-statics.ts:15-16`
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.ts:48-56`
- root `CLAUDE.md`, "MCP and Agent Module Resolution Architecture"

## History

Generated files are not hand-edited (see the generatedConfig snippet); fix the generator, then run `npm run init`.
