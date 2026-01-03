After any changes are made to this project, or any code this projects import from, you need to tell the User to restart
the MCP before manually testing changes.

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