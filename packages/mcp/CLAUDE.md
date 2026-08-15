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
- `flows/quest/quest-flow.integration.test.ts` — **four** parallel hardcoded arrays (names, handler
  types, descriptions, schema types) that have to stay index-aligned with each other.
- `packages/server/src/statics/dispatcher-mcp-tools/dispatcher-mcp-tools-statics.ts` — only when
  `/dumpster-launch` itself calls the tool for orchestration control. Listing it there keeps the
  dispatcher's own tool-call chatter out of the web chat panel.

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

### Identifying a sub-agent caller deterministically

When a sub-agent calls a tool that needs to know its own identity (e.g. `get-agent-prompt`
stamps work-item `sessionId`/`agentId`):

1. Read `meta?.['claudecode/toolUseId']` from the handler params — `ToolHandler`
   (`contracts/tool-registration/tool-registration-contract.ts`) carries `meta` alongside
   `args`.
2. Pass it to `claudeCodeParentSessionFindByToolUseIdBroker({projectDir, toolUseId})`
   (in `packages/mcp/src/brokers/claude-code-parent-session/find-by-tool-use-id/`). It
   scans every `~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl`
   file for an assistant line whose `tool_use.id` matches. The matching file's basename
   yields `realAgentId`; the containing session dir yields `parentSessionId`.
3. The broker retries on miss (`MAX_SCAN_ATTEMPTS × SCAN_RETRY_DELAY_MS` in that file — ~3 s)
   to absorb the race where Claude Code dispatches the MCP call before flushing the
   sub-agent's `tool_use` line to disk.
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

## Paths from tool callers are `PathSegment`, not `FilePath`

MCP tool callers send **bare repo-relative** paths (`packages/mcp/src/foo.ts`). Shared's
`filePathContract` is `z.union([absoluteFilePathContract, relativeFilePathContract]).brand<'FilePath'>()`
and the relative branch requires a `./` or `../` prefix — a bare path matches neither branch and is
rejected. So this package routes caller paths through `pathSegmentContract` from
`@dungeonmaster/shared/contracts` — `z.string().brand<'PathSegment'>()`, whose PURPOSE explicitly
makes no prefix commitment. It is the `filepath` input type of every `adapters/fs/*` adapter that
takes one (`read-file`, `write-file`, `readdir`, `readdir-if-exists`, `stat`, `mkdir`), and the
dominant path type in the package. The two exceptions are `fs-glob-adapter`, whose optional `cwd`
is the local `AbsolutePath` brand, and `adapters/path/*`, which take raw `string[]`.

**The tradeoff:** `PathSegment` validates nothing — it accepts the empty string. It is the bottom of
the path lattice: the brand is a compile-time domain marker carrying no runtime guarantee. A value
that must be genuinely absolute has to be parsed through `absoluteFilePathContract`; never infer
absoluteness from a `PathSegment` brand.

**Two local contracts a dedup pass *should* collapse** (named follow-ups, not drive-by work):

- `contracts/import-path/import-path-contract.ts` — byte-identical to
  `packages/shared/src/contracts/import-path/import-path-contract.ts`. Its only consumer here is
  `contracts/folder-dependency-tree/`.
- `contracts/folder-type/folder-type-contract.ts` — `z.string().brand<'FolderType'>()`, while
  shared's contract of the **same brand string** is `z.enum([...folderConfigStatics keys])`. Every
  production consumer in this package imports shared's; the local one is reachable only from its own
  stub and test. The brand collision means the two are mutually assignable while validating
  differently, so collapsing it needs a deliberate pass.
