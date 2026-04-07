After any changes are made to this project, or any code this projects import from, you need to tell the User to restart
the MCP before manually testing changes.

## Adding New MCP Tools

When adding a new MCP tool, you MUST also add the permission string to `.claude/settings.json` in the repo root.
The install script (`settingsPermissionsAddBroker`) generates permissions from `mcpToolsStatics.tools.names` and writes
them during `dungeonmaster init`, but existing installs (including this repo) won't pick up the new permission until
re-init. Add the permission manually: `"mcp__dungeonmaster__<tool-name>"` to `permissions.allow[]` in
`.claude/settings.json`.

## Troubleshooting: MCP Tools Not Available

If `claude mcp list` shows "Connected" but tools give "No such tool available" error:

### 1. Reset MCP Project Choices

Claude Code caches MCP tool state. If tools fail to load initially, the broken state persists even after fixing the
code.

```bash
claude mcp reset-project-choices
```

### 2. Restart Claude Code

After resetting, restart Claude Code completely. You'll be prompted to re-approve the MCP server, forcing a fresh tool
load.