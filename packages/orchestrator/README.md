# Harness behaviour this package depends on

**Every claim on this page is measured against Claude Code `2.1.265`, and none of it is documented by
Anthropic.** It is harness behaviour, not API, so it can change in any release. Before trusting a
line here, check `claude --version`; if it does not read `2.1.265`, re-measure before relying on it.
The last section says how.

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

## Re-measuring after a CLI upgrade

The four claims above are each a two-minute probe, and none needs a ward run. Spawn a `claude -p`
child with this package's argv and a prompt that dispatches one sub-agent; have that sub-agent
background a command writing a marker file after a delay longer than the turn; end the turn; then
check whether the marker appears. Vary one thing at a time — the env var, the Bash `timeout`, whether
the outstanding work is a command or an `Agent` — and read the marker rather than the session's own
report, which claims success either way.
