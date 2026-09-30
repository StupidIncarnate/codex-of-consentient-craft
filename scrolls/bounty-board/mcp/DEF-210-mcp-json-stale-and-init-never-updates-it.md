# DEF-210: `dungeonmaster init` never rewrites an existing `dungeonmaster` entry in `.mcp.json`, so this repo's copy is stale

| | |
|---|---|
| Kind | defect |
| Status | ready |
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

**Decided by the user, 2026-09-30: `init` always rewrites the `dungeonmaster` entry** in `.mcp.json`. It owns that key outright, as it owns its sections of `.claude/settings.json`. Other servers in the file are left alone.

**This must land with the dogfood case, or this repo's MCP loses its quests.** The current generated form (`mcpServerStatics.resolveScript`, `require('@dungeonmaster/mcp')` with a global fallback) sets no `DUNGEONMASTER_HOME`, so the server falls back to `~/.dungeonmaster`. This repo's hand-shaped entry sets `DUNGEONMASTER_HOME="${DUNGEONMASTER_HOME:-$(pwd)/.dungeonmaster}"`, the same home `npm run prod` uses, which is how the MCP tools here see this repo's quests. So the generator must write that home in this checkout (and in its worktrees, scenario 2), and nowhere else. Then check scenarios 1 to 4 of the root `CLAUDE.md` "Four Resolution Scenarios" still resolve as written, and make that table match. Regenerate with the root `CLAUDE.md` "Regenerating `.claude/settings.json` Here" steps; never hand-edit `.mcp.json`.

## Where to look

- `.mcp.json:8`
- `packages/mcp/src/statics/mcp-server/mcp-server-statics.ts:15-16`
- `packages/mcp/src/responders/install/config-create/install-config-create-responder.ts:48-56`
- root `CLAUDE.md`, "MCP and Agent Module Resolution Architecture"

## History

Generated files are not hand-edited (see the generatedConfig snippet); fix the generator, then run `npm run init`.
