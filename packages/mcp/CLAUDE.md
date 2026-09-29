## Adding New MCP Tools

Add the tool to `mcpToolsStatics.tools.names` — that static lives in **shared**, not here:
`packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts`. `settingsPermissionsAddBroker`
generates the `mcp__dungeonmaster__*` grants from it. **Do NOT hand-edit
`.claude/settings.json`** — see root `CLAUDE.md` ("Never Edit `.claude/settings.json` Directly") for the
build → `npm link --workspaces` → `npm run init` flow that regenerates permissions for this repo.

**That name is one edit of roughly 29.** A tool with an input contract needs its responder, contract
+ stub + test, and registration in the owning flow — then a tail of places that pin the tool list by
full value and fail one red test at a time. Trace an existing tool (`get-quest-summary`) before
starting, and expect these:

- `packages/shared/src/statics/mcp-tools/mcp-tools-statics.test.ts` — full-value `toStrictEqual` on
  the names array.
- `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` — its
  test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names, so a missing probe
  entry is a hard fail.
- `TOOLS_EXEMPT_FROM_SIZE_CAP` in `flows/mcp-server/mcp-server-flow.integration.test.ts`. The
  size-capped set is `mcpToolsStatics.tools.names` MINUS this list, and every tool in it is invoked
  with `{}`, so **a tool with required input belongs here too** — not only one whose response
  exceeds the cap. A `.strict()` contract rejects `{}` and the assertion `expect(response.error)
  .toBe(undefined)` fails.
- `brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` — **seven** separate
  copies of the expected allow-list, an **eighth** in
  `flows/install/install-flow.integration.test.ts`, and a **ninth** in
  `transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts` (whose test
  NAME also carries the tool count).
- The owning flow's integration test — `flows/quest/quest-flow.integration.test.ts` for a quest
  tool, `flows/architecture/architecture-flow.integration.test.ts` for an architecture one — carries
  **four** parallel hardcoded arrays (names, handler types, descriptions, schema types) that have to
  stay index-aligned with each other, and a test NAME carrying the registration count.
- `flows/mcp-server/mcp-server-flow.integration.test.ts` also holds a per-tool
  `describe('tools/call with <tool>')` block that drives the real stdio server, separate from the
  size-cap suite above.
- A tool whose handler needs a broker of its own reaches two more files: `packages/mcp/src/brokers/brokers.ts`
  exports the broker, and the owning responder's own `.proxy.ts` calls every broker proxy that responder
  reaches, each imported from its own file.

**A tool handled inline in `responders/quest/handle/quest-handle-responder.ts` costs cyclomatic
complexity**, and that function sits AT the ceiling (`complexity: max 50`). A branch with a
`try/catch` and a ternary costs 3 and fails lint. Add the tool as a colocated
`<tool>-layer-responder.ts` registered in that file's `layerResponders` map instead — a map entry
costs nothing.

## What MCP Sees from the Calling Claude Code

What's available to a tool handler when Claude Code invokes an MCP tool over stdio:

| Source | Available? | Notes |
|---|---|---|
| `request.params._meta.claudecode/toolUseId` | **Yes — per call.** | The toolUseId of the **sub-agent's own MCP call** (NOT the parent's Task() dispatch id — those are distinct, verified empirically). Unique per MCP call. Surfaced via the `meta` param in `ToolHandler`. |
| `request.params._meta.progressToken` | Yes — per call. | MCP standard; opaque token for out-of-band progress notifications. |
| `meta['dungeonmaster/caller']` | **Yes — per call, when the hook ran.** | `{ cwd, sessionId, agentId? }`, stamped onto the call's arguments by the `dungeonmaster-pre-mcp-caller` PreToolUse hook and moved into `meta` by `toolCallCallerLiftTransformer` in `mcp-server-flow.ts`. Read it with `metaCallerContextTransformer`. |
| `extra.sessionId` (MCP SDK `RequestHandlerExtra.sessionId`) | **No.** | Unset for stdio transport. Don't rely on it. |
| `extra._meta` | Yes — mirrors `request.params._meta`. | Either is fine. |
| `process.env.CLAUDE_CODE_SESSION_ID` | **No.** | Not set on the MCP child — verified absent. Identify a caller via the toolUseId path below. |
| `process.env.CLAUDE_CODE_SSE_PORT` | Yes. | Set on the MCP child at boot. |
| `process.env.CLAUDE_PROJECT_DIR` | Yes. | Absolute path of the project Claude Code launched from. |
| `process.env.CLAUDE_CODE_ENTRYPOINT` | Yes. | `cli`, etc. |

**MCP child lifecycle:** **One MCP stdio child per parent Claude Code session.** All sub-agents
spawned via `Task()` share the same MCP child — they do NOT get their own. The MCP server
therefore receives interleaved calls from the parent and every live sub-agent simultaneously.
Env vars are per-process and set at MCP boot; they cannot disambiguate per-call callers.

### Identifying the caller: the hook first, a transcript scan only without it

**Read `metaCallerContextTransformer({ meta })` first.** The `dungeonmaster-pre-mcp-caller`
PreToolUse hook runs before every `mcp__dungeonmaster__*` call and stamps the caller's `cwd`,
`session_id` and — for a Task-dispatched sub-agent only — `agent_id` onto the call. For a sub-agent,
`sessionId` is the PARENT session and `agentId` is the id in its `subagents/agent-<id>.jsonl`
filename: the same pair the scan below recovers, measured identical against Claude Code 2.1.283.
Both resolvers (`callerRepoRootResolveBroker`, `ResolveCallerSessionLayerResponder`) take this
path when it is present and never scan.

**The scan below is the fallback for a call no hook touched** — a consumer whose settings predate the
hook, or a client other than Claude Code. It is slow: Claude Code writes a call's own `tool_use` line
only when the call finishes or is moved to the background, so during the call every pass misses and
re-reads the whole transcript directory until the retry budget runs out.

Each resolver reads `meta?.['claudecode/toolUseId']` from the handler params — `ToolHandler`
(`contracts/tool-registration/tool-registration-contract.ts`) carries `meta` alongside `args` —
and scans this cwd's own `<sessionId>.jsonl` files for a matching `tool_use.id`:
`callerRepoRootResolveBroker` via `claudeCodeCallerCwdFindByToolUseIdBroker`, and
`ResolveCallerSessionLayerResponder` via `claudeCodeSessionFindByToolUseIdBroker`. Each broker
retries on miss (`maxAttempts` in `claudeSessionScanStatics`) to absorb the race where Claude
Code dispatches the MCP call before flushing the `tool_use` line to disk.

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

## Paths from tool callers are `PathSegment`, not `FilePath`

MCP tool callers send **bare repo-relative** paths (`packages/mcp/src/foo.ts`). Shared's
`filePathContract` is `z.union([absoluteFilePathContract, relativeFilePathContract]).brand<'FilePath'>()`
and the relative branch requires a `./` or `../` prefix — a bare path matches neither branch and is
rejected. So this package routes caller paths through `pathSegmentContract` from
`@dungeonmaster/shared/contracts` — `z.string().brand<'PathSegment'>()`, whose PURPOSE explicitly
makes no prefix commitment. It is the path type of the brokers, responders and path transformers here
(`file-scanner`, `mcp-discover`, `path-to-relative`, `path-to-tree-relative`, and the rest), and of the
`path` and `relatedFiles` fields on `file-metadata`, `discover-result-item` and `tree-item`. The
architecture responder is the exception: it parses the repo root through `absoluteFilePathContract`.

**The tradeoff:** `PathSegment` validates nothing — it accepts the empty string. It is the bottom of
the path lattice: the brand is a compile-time domain marker carrying no runtime guarantee. A value
that must be genuinely absolute has to be parsed through `absoluteFilePathContract`; never infer
absoluteness from a `PathSegment` brand.
