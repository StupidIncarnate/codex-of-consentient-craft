# MCP caller directory: replace the transcript scan with a PreToolUse hook

Status: built. The `dungeonmaster-pre-mcp-caller` hook stamps `dungeonmasterCaller: { cwd, sessionId, agentId? }` onto
every `mcp__dungeonmaster__*` call. `toolCallCallerLiftTransformer` in `mcp-server-flow.ts` moves it into `meta` before
any tool contract parses the arguments. All three resolvers read it first and keep their transcript scan only as a
fallback for calls no hook touched. The deletions listed under "What goes away" are NOT done yet: they wait until every
consumer has regenerated its settings.

What the checks below found, measured with a throwaway echo MCP server against Claude Code 2.1.283:

| Check | Result |
|---|---|
| `updatedInput` reaches MCP tool arguments | Yes, including a tool whose schema says `additionalProperties: false`, and with no `permissionDecision` in the hook output. |
| Hook `cwd` equals the transcript line's `cwd` | Yes, on all three calls: main agent before a `cd`, after a `cd`, and a sub-agent. A sub-agent inherits its parent's directory; its own `cd` changes neither value. |
| Hook `session_id` for a sub-agent | The parent session's id, the same one the parent-session scan returns. |
| Hook `agent_id` for a sub-agent | The id in its `subagents/agent-<id>.jsonl` filename. Absent for the main agent. |

## The problem

Every dungeonmaster MCP tool call can take tens of seconds or minutes, whatever the tool does.

Measured on 2026-09-27, in a fresh session on this repo:

| Call | Dispatched | Result | Wall time |
|---|---|---|---|
| `discover` (glob into one package, 10 files matched) | 20:08:57.757 | 20:09:44.129 | 46 s |
| `get-project-inventory({ packageName: 'mcp' })` | 20:10:30.189 | not before 20:12:30 | over 120 s |

During those calls the session's MCP server (`node packages/mcp/dist/src/index.js`) sat at 85% CPU. A second
session's MCP server sat at 92% CPU at the same time. Load average was 7.

## Why it is slow

Before running any tool, the server works out which directory the caller is in. It does that by searching Claude
Code's transcript files.

1. `callerRepoRootResolveBroker` reads `_meta['claudecode/toolUseId']` from the call.
2. It checks the warm cache (`claudeCodeCallerCwdScanCachedEntriesBroker`). On a new session the cache is empty.
3. It falls to the cold scan, `claudeCodeCallerCwdFindByToolUseIdBroker`. That lists
   `~/.claude/projects/<encoded repo path>/`, sorts the files newest first, and reads each file whole, looking for
   the line whose `tool_use.id` matches.
4. On a miss it reads every sub-agent file too (`<session>/subagents/agent-*.jsonl`).
5. On a miss after that, it waits 100 ms and starts again, up to 30 times (`claudeSessionScanStatics`).

Three facts make this slow:

| Fact | Measurement |
|---|---|
| The transcript directory is large | 249 session files (381 MB) plus 1,666 sub-agent files (2.1 GB) |
| One full miss pass is slow | 8.6 s, timed with a Node script doing the same reads |
| **The call's own line is not on disk while the call runs** | A Bash call searched the transcript for its own `tool_use` line. The newest line on disk was the previous call's. |

The statics comment says Claude Code writes the line 50 to 200 ms after dispatch. It also calls 30 × 100 ms "a 3s
ceiling". In this Claude Code version the line is written only when the call finishes or is moved to the
background. So the first pass always misses, every retry misses, and the real ceiling is 30 passes of 8.6 s or more:
over 4 minutes.

`discover` returned at 46 s only because the user sent a message. At 20:09:39 Claude Code moved the call to the
background, which wrote a `queue-operation` line and flushed the transcript. The next pass found the ID, and the
result arrived at 20:09:44.

Every open session pays this on every call. Several sessions scanning the same 2.5 GB at once slow each other down
further.

## Why it scans transcripts at all

The scan answers a real question. One MCP server process serves a whole top-level session, including every sub-agent
it dispatches. The server's own `process.cwd()` never moves. A sub-agent working in `worktrees/<name>` still calls a
server sitting in the main checkout, and the server must answer for the worktree.

An MCP call does not carry the caller's directory. The only per-call value is the tool-use ID. Claude Code writes the
caller's `cwd` next to that ID in its transcript, so the code searches for the ID to recover the directory.

MCP `roots` does not help. Roots belong to the client connection, which every sub-agent shares, so they carry no
per-call directory.

## The fix: a PreToolUse hook

Claude Code runs a `PreToolUse` hook before every tool call. The hook's input already holds `cwd`, `tool_use_id`,
`tool_name` and `tool_input`. The hook runs before the MCP call is sent, so the timing problem cannot happen.

`@dungeonmaster/hooks` already installs `PreToolUse` entries, so this adds one matcher to an existing generator.

Two ways to use it:

| Option | How it works | Trade-off |
|---|---|---|
| 1. Rewrite the arguments (preferred) | A hook matching `mcp__dungeonmaster__.*` returns `hookSpecificOutput.updatedInput`, adding `callerCwd: <cwd>` to the tool arguments. The server reads it straight from the input. | No files and no lookup. Depends on `updatedInput` reaching an MCP tool's arguments. |
| 2. Hand-off file | The hook writes the `cwd` to `<dungeonmaster home>/caller-cwd/<tool_use_id>`. The server reads that one file by exact name, then deletes it. | Works even if `updatedInput` does not reach MCP tools. Needs cleanup of files whose call never arrived. |

In both options, when the value is missing the server uses its own directory at once. That keeps an old consumer
repo working, one whose hooks were never regenerated. It loses only worktree awareness.

### Check these before building

1. **The hook's `cwd` is the sub-agent's worktree.** Dispatch a sub-agent into a worktree. Have the hook log its
   `cwd`. Confirm it names the worktree, not the parent session's directory. The transcript scan reads the same
   field, so this very likely holds.
2. **`updatedInput` reaches MCP tool arguments.** Register a throwaway hook that adds a field to one
   `mcp__dungeonmaster__*` call. Have the tool echo its input. If the field is absent, use option 2.
3. **The input contracts accept the new field.** Each tool's input contract must allow `callerCwd`, or the hook's
   addition fails validation. With option 1, define the field once and share it across every tool contract.

## What goes away

With either option, the whole transcript machinery is deleted:

| File or folder in `packages/mcp/src` | Fate |
|---|---|
| `brokers/claude-code-caller-cwd/find-by-tool-use-id/` (broker and tail-scan layer) | delete |
| `brokers/claude-code-caller-cwd/scan-cached-entries/` | delete |
| `state/caller-cwd-scan-cursor/`, `statics/caller-cwd-scan-cursor/` | delete |
| `statics/claude-session-scan/` | delete |
| `contracts/caller-cwd-scan-cursor/`, `contracts/claude-code-tool-use-scan-line/` | delete, unless something else imports them |
| `brokers/caller-repo-root/resolve/` | keep, simplified: take `callerCwd` or fall back to the server's cwd, then walk up to `.dungeonmaster.json` as now |

Before deleting, check with `discover` whether `brokers/claude-code-session/` and
`brokers/claude-code-parent-session/` depend on the same scan. They also find things by tool-use ID, and may have
the same timing problem.

Keep the `source` and `configFound` fields that the caller banner shows. `source` becomes `caller-cwd` when the hook
supplied the directory and `server-cwd-fallback` when it did not.

## If the hook cannot be built soon

A stopgap inside the current design, in `packages/mcp/src`:

1. Bound the retry by elapsed time, not attempt count. Stop after about 3 s and fall back to the server's cwd.
2. On a retry, re-read only files whose modification time changed since the last pass. That is usually one file.

These cut the hang to about 3 s plus one pass. They do not fix the root cause: during a top-level call the scan
almost never finds its line, so it mostly adds delay before the fallback.

## Tests to write

1. Hook: given a `PreToolUse` input for an `mcp__dungeonmaster__*` tool, it outputs `updatedInput` equal to the
   original input plus `callerCwd` set to the input's `cwd`. For any other tool it outputs nothing.
2. Resolver: `callerCwd` inside a worktree resolves `repoRoot` to the worktree and `source` to `caller-cwd`.
3. Resolver: no `callerCwd` resolves to the server's repo root, with `source` set to `server-cwd-fallback`, and
   reads no transcript file.
4. A timing guard: a tool call with no `callerCwd` returns in well under a second in an integration test.
