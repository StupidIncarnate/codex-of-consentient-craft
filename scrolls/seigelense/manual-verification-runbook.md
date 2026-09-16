# Driving the real siegelense CLI in this worktree

Read this before any manual verification pass. It names the one entry point that runs THIS worktree's
code, and the housekeeping that stops a clean run from reading as a failure.

## `dungeonmaster` on your PATH runs the MAIN checkout, not this worktree

```
$ readlink -f $(which dungeonmaster)
/home/brutus-home/projects/codex-of-consentient-craft/packages/cli/dist/bin/dungeonmaster.js
```

That path has no `worktrees/siegelense` in it. The global npm link points at the main checkout, and
`cli-siegelense-responder.ts` reaches the siegelense package through `require.resolve`, which resolves
from the binary's own location. So `dungeonmaster siegelense <call>` typed at a terminal runs the main
checkout's siegelense, whatever you just built here.

**Never re-link to fix this.** `npm link --workspaces` from the worktree repoints the global binary for
every other session on this machine.

## Use the worktree's own binary

```bash
node packages/cli/dist/bin/dungeonmaster.js siegelense <call>
```

Run it from the worktree root. It is the same entry point a person types: the same argv, the same gate
in `cli-siegelense-responder.ts`, the same flow. Only the resolution root differs.

Confirmed working:

```
$ node packages/cli/dist/bin/dungeonmaster.js siegelense
No siegelense instances running.
```

## The CLI runs COMPILED output

`packages/cli/dist/bin/dungeonmaster.js` is a bundle, and the driver it spawns runs
`packages/siegelense/dist/**`. A source edit changes nothing you can type until someone builds:

```bash
npm run build --workspace=@dungeonmaster/siegelense
npm run build --workspace=@dungeonmaster/cli
```

**Only the coordinator builds.** A build takes no lock and rewrites every package's output, so a build
in flight breaks every other agent's checks. If you need one, say so and stop.

## Two pieces of housekeeping before a driver run

**Clear the stale sockets.** The driver's control socket lives at a machine-global path,
`/tmp/dm-siege-sockets/<id>.sock`. A SIGKILLed driver leaves its socket file behind, because a unix
socket path is not removed when its process dies. Eight of them made
`driver-flow.integration.test.ts` fail deterministically on its two orphan-reap assertions; removing
the directory made all six pass. The mechanism is not established — measure it before you guess.

```bash
rm -rf /tmp/dm-siege-sockets
```

**Sweep for leaked lanes.** A lane that outlives its driver holds a port and looks like nothing. A test
driver runs under a testbed `DUNGEONMASTER_HOME` in the OS `/tmp`, and `testbed.cleanup()` deletes that
home with the registry row inside it — so any surviving lane child is unreapable by every recovery path
the tool has. Only a sweep finds it.

```bash
ps -eo pid,etime,cmd | grep "bin/server-entry" | grep -v grep
ss -lptn | grep node
```

Two of these were sitting here at the start of this round, 11 and 9 minutes old, holding ports 40349
and 44653, with an empty registry and no driver alive. Both were killed by hand.

## Report what you saw, not what you concluded

Paste the command and its real stdout. A manual pass that summarises is worth nothing — three of this
build's worst defects were caught only because someone read the actual bytes a real run printed.
