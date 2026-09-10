# Harness behaviour this package depends on

**Every claim on this page is measured, and none of it is documented by Anthropic.** It is harness
behaviour, not API, so it can change in any release. Claims were measured against Claude Code
`2.1.265` unless a section names its own version. Before trusting a line here, check
`claude --version` against the version that line was measured at; if it has moved, re-measure. The
last section says how.

This matters because `child-process-spawn-stream-json-adapter.ts` spawns a headless `claude -p`
child for every Node-dispatched role, and a headless child does not behave like the interactive
session a prompt was probably written in.

## A spawned child TERMINATES its background commands when its turn ends

A sub-agent inside a `claude -p` child that backgrounds a command and then ends its turn loses that
command. The command is killed part-way and the session still reports success.

| What the sub-agent does | Whole-repo ward outcome |
|---|---|
| ends its turn | killed at 647 s, mid-`e2e`, session reports `is_error: false` |
| stays in its turn and waits | `exit=0` at about 740 s |

Measured three ways with the same result: a child spawned by this package's own adapter, a child
spawned by hand with identical argv, and a chat child the running server spawned from a prompt
pasted into the web UI. The interactive case differs — there the harness re-enters the sub-agent
when the command exits — so **a rule inferred from a `/dumpster-launch` run does not transfer to Node
dispatch.**

The harness says so itself, in the Bash tool result, and only in the headless case:

> If it exits while you are still working you will be notified, but it is terminated when you give
> your final response and no notification can follow that — so do not end your turn to wait for it

The interactive wording is just `You will be notified when it completes.`

## An async HELPER survives, and the parent is re-entered

The opposite is true for the `Agent` tool. A child that dispatches with `run_in_background: true`
and ends its turn keeps its helper: the helper ran its full 90 s of work, wrote its marker, and the
parent was re-entered with the result in a second turn. So "end your turn while a helper is out" is
sound, and only a backgrounded COMMAND is unsafe. `hasRunningBackgroundTaskGuard` draws exactly that
line — see `packages/hooks/CLAUDE.md`.

## A stop event's `background_tasks` spans the whole SESSION — measured at `2.1.267`

The array a stop hook reads is not the stopping agent's own commands. It is every command and every
async agent the session holds, with no field saying who started which. A sibling sub-agent's command
appears in its siblings' events; a command the top-level session started appears in its child's AND
its grandchild's.

That is what makes a lane-per-minion design expensive here. One long-lived process — a siege lane, a
dev server, a watcher — refuses a stop for every agent in the session, and only the one that started
it can end it. On one measured quest run 56 of 70 sub-agents were refused 1085 times, 34 of them
holding nothing at all.

Ownership is recoverable from the transcript: the harness prints the task's `id` into the starting
agent's own transcript and nowhere else. `@dungeonmaster/hooks` scopes on exactly that — see
`packages/hooks/CLAUDE.md` for the shape, both result wordings, and the entry lifecycle.

**A detached process escapes the ledger entirely.** `setsid nohup <cmd> &` from a foreground Bash
call produces no `background_tasks` entry at all, and the process outlives the agent, the session
and the `claude -p` child. A lane launched that way blocks nobody — and is reaped by nothing but its
own idle timeout, so it needs one.

## `run_in_background: true` blocks a sub-agent for the Bash `timeout`

It does not return immediately inside a sub-agent. It blocks for whatever `timeout` the call carries,
then returns saying the command moved to the background. Calls passing no timeout blocked for 600 s;
calls passing `timeout: 20000` returned inside 20 s. A sub-agent that wants a genuine background
start has to pass a short timeout explicitly.

## `TaskOutput` does not exist inside a sub-agent

A sub-agent searching for it gets `No matching deferred tools found`. Any brief telling a sub-agent
to poll a background task with `TaskOutput` names a tool it cannot call. Waiting on a marker file
with repeated foreground Bash calls is the route that works.

## `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` has no effect

Print mode does not wait for a background task after the final turn, at any value of this variable.
Eight probes — unset, `0`, and `3600000`, each at the child's top level and inside a sub-agent, with
the task silent and with it printing every 5 s — all lost the task while the child exited within
17 s. The adapter still sets it, defensively and at no cost, in case a later release honours it. The
protection that actually works is the `SubagentStop` guard.

## Where a session's transcript is written — measured against `2.1.266`

Claude CLI writes every transcript under `~/.claude/projects/`, never inside the project. **One
input decides which folder: the session's own cwd**, with every character that is not an ASCII
letter or digit replaced by `-`, one for one. `claudeProjectPathEncoderTransformer` mirrors that
rule.

```
~/.claude/projects/<encoded cwd>/<sessionId>.jsonl
~/.claude/projects/<encoded cwd>/<sessionId>/subagents/agent-<realAgentId>.jsonl
~/.claude/projects/<encoded cwd>/<sessionId>/subagents/agent-<realAgentId>.meta.json
```

Four things follow, each measured directly:

- **A sub-agent is not a session.** It gets no session id and no directory of its own. Every line of
  its file carries the PARENT's `sessionId` and the PARENT's `cwd`, plus `isSidechain: true`. Its own
  identity lives only in the filename and the `.meta.json` sidecar.
- **A sub-agent inherits its parent's cwd, and nothing an agent does changes that.** A parent sitting
  in the repo root that calls `create-worktree` and then dispatches a sub-agent gets a sub-agent
  whose own `pwd` is still the repo root — it reaches the worktree only through absolute paths. A
  parent whose cwd IS a worktree gets a sub-agent in that worktree.
- **Nesting is flat.** A sub-agent spawned by a sub-agent lands in the same single `subagents/`
  directory as its grandparent's own children, never inside its parent. Depth survives only as
  `spawnDepth` in the sidecar. Measured to depth 3.
- **A project-local `.claude/` directory plays no part.** A worktree whose `.claude/` was deleted
  still got its own encoded directory, named from the cwd, holding both the session and its
  sub-agent.

**The consequence for this package: a carved quest's transcripts are split across two directories** —
the intake conversation under the repo root's encoding, every role dispatched after the carve under
the worktree's. Code resolving one directory per QUEST reaches only one of those two groups. A cwd is
a property of the SESSION, not of the quest.

## Re-measuring after a CLI upgrade

The four background-command claims above are each a two-minute probe, and none needs a ward run. Spawn a `claude -p`
child with this package's argv and a prompt that dispatches one sub-agent; have that sub-agent
background a command writing a marker file after a delay longer than the turn; end the turn; then
check whether the marker appears. Vary one thing at a time — the env var, the Bash `timeout`, whether
the outstanding work is a command or an `Agent` — and read the marker rather than the session's own
report, which claims success either way.

The transcript-location claims are one more probe of about a minute. Snapshot the directory names
under `~/.claude/projects/`; create a worktree and delete its `.claude/`; spawn a `claude -p` child
with that worktree as its cwd and a prompt that dispatches one sub-agent; then diff the snapshot.
Read the directory that appears and the `cwd` recorded inside the files, never the session's own
account of where it was.
