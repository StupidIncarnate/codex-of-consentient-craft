## Adding New MCP Tools

Add the tool to `mcpToolsStatics.tools.names` so `settingsPermissionsAddBroker` picks it up. **Do NOT hand-edit
`.claude/settings.json`** — see root `CLAUDE.md` ("Never Edit `.claude/settings.json` Directly") for the
build → `npm link --workspaces` → `npm run init` flow that regenerates permissions for this repo.

## What MCP Sees from the Calling Claude Code

What's available to a tool handler when Claude Code invokes an MCP tool over stdio:

| Source | Available? | Notes |
|---|---|---|
| `request.params._meta.claudecode/toolUseId` | **Yes — per call.** | The parent's `Task()` tool-use id that originated the call. Unique per Task() dispatch, race-free across parallel sub-agents under the same MCP child. Use this to identify the caller. Surfaced via the `meta` param in `ToolHandler`. |
| `request.params._meta.progressToken` | Yes — per call. | MCP standard; opaque token for out-of-band progress notifications. |
| `extra.sessionId` (MCP SDK `RequestHandlerExtra.sessionId`) | **No.** | Unset for stdio transport. Don't rely on it. |
| `extra._meta` | Yes — mirrors `request.params._meta`. | Either is fine. |
| `process.env.CLAUDE_CODE_SESSION_ID` | **No.** | NOT set on the MCP child today. Was previously assumed set; verified absent. |
| `process.env.CLAUDE_CODE_SSE_PORT` | Yes. | Set on the MCP child at boot. |
| `process.env.CLAUDE_PROJECT_DIR` | Yes. | Absolute path of the project Claude Code launched from. |
| `process.env.CLAUDE_CODE_ENTRYPOINT` | Yes. | `cli`, etc. |

**MCP child lifecycle:** **One MCP stdio child per parent Claude Code session.** All sub-agents
spawned via `Task()` share the same MCP child — they do NOT get their own. The MCP server
therefore receives interleaved calls from the parent and every live sub-agent simultaneously.
Env vars are per-process and set at MCP boot; they cannot disambiguate per-call callers.

### Identifying a sub-agent caller deterministically

When a sub-agent calls a tool that needs to know its own identity (e.g. `get-agent-prompt`
stamps work-item `sessionId`/`agentId`):

1. Read `meta?.['claudecode/toolUseId']` from the handler params (after widening
   `ToolHandler` to accept `meta`).
2. Read the dispatcher's registered monitor session via `orchestratorGetMonitorSessionAdapter()`
   → `{ sessionId, projectDir }` or null.
3. Pass both to `claudeCodeSubagentFindByToolUseIdBroker` — it scans
   `<sessionsDir>/<parentSessionId>/subagents/agent-*.meta.json` for the file whose
   `toolUseId` field matches, then returns the realAgentId sliced from the filename.

Each Task() dispatch writes its own `agent-<realAgentId>.meta.json` sidecar at spawn time
(before the sub-agent's first MCP call), so the file is always present. Shape:
`{"agentType":"general-purpose","description":"...","toolUseId":"toolu_..."}`.

The legacy mtime-based parent-session resolver (`claudeCodeSessionResolveBroker`) is a
fallback only — it races against any other active Claude session in the same project cwd.
See that broker's PURPOSE for the failure mode.

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
