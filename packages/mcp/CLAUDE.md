## Adding New MCP Tools

Add the tool to `mcpToolsStatics.tools.names` so `settingsPermissionsAddBroker` picks it up. **Do NOT hand-edit
`.claude/settings.json`** — see root `CLAUDE.md` ("Never Edit `.claude/settings.json` Directly") for the
build → `npm link --workspaces` → `npm run init` flow that regenerates permissions for this repo.

## What MCP Sees from the Calling Claude Code

What's available to a tool handler when Claude Code invokes an MCP tool over stdio:

| Source | Available? | Notes |
|---|---|---|
| `request.params._meta.claudecode/toolUseId` | **Yes — per call.** | The toolUseId of the **sub-agent's own MCP call** (NOT the parent's Task() dispatch id — those are distinct, verified empirically). Unique per MCP call. Surfaced via the `meta` param in `ToolHandler`. |
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
2. Pass it to `claudeCodeParentSessionFindByToolUseIdBroker({projectDir, toolUseId})`
   (in `packages/mcp/src/brokers/claude-code-parent-session/find-by-tool-use-id/`). It
   scans every `~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl`
   file for an assistant line whose `tool_use.id` matches. The matching file's basename
   yields `realAgentId`; the containing session dir yields `parentSessionId`.
3. The broker retries on miss (up to ~1 s total) to absorb the race where Claude Code
   dispatches the MCP call before flushing the sub-agent's `tool_use` line to disk.
4. Returns `{parentSessionId, realAgentId}` — deterministic across any number of
   parallel Claude sessions in the same cwd.

The sibling `agent-<realAgentId>.meta.json` sidecar does exist (Claude Code writes it at
Task() spawn time with the **parent's** Task() tool-use-id), but its toolUseId field does
NOT match `_meta.claudecode/toolUseId` and so cannot be used for this resolution.

## `npm run build` kills the running MCP child

The MCP stdio child runs the compiled `packages/mcp/dist/src/index.js`. A `npm run build` (or any
build that rewrites this package's `dist/`) overwrites those files out from under the running child,
so the child dies and the parent Claude Code session loses every `mcp__dungeonmaster__*` tool.

Consequences:

- **Any fix to MCP code only takes effect after a rebuild AND an MCP reconnect.** Editing source is
  not enough — rebuild `dist/`, then reconnect (`/mcp` → reconnect dungeonmaster, or restart the
  session's MCP) so a fresh child loads the new `dist/`.
- **Any rebuild for an unrelated reason still drops the tools.** After building mid-session, reconnect
  the MCP before issuing further MCP calls. Batch source fixes so you rebuild + reconnect once.

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
