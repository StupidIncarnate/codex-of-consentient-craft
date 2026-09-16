# @dungeonmaster/siegelense

## Never `.first()` / `.last()` in a command

Ambiguity THROWS, and the error carries the candidates. The obvious line to write is the wrong one,
and the lint rule's message points here.

## Never `querySelector` in eval source

Use `querySelectorAll` and count instead. Singular silently returns match one, and lint cannot see
inside the template literal to catch it.

## A command returns a READING, never a verdict on a unit

This is the founding rule from `siege-command.ts`'s own header. Comparing two measured values is a
reading; deciding a unit passes is not.

## The key reads OWN text nodes, never `textContent`

A recursive text read pulled an entire Mantine stylesheet into one reading. This is the single
measured reason the old `dom` verb was unusable.

## A ref resolves only in its minting instance and page state

Four boundaries look passable and none are. Carrying a ref across an instance, a reload, a
navigation, or a stale page state hands back a handle to something that is no longer there.

## A recipe touches state, never a screen

A recipe holding a DOM handle is doing a walk's job.

## `run` returns a status; `results` returns payloads

Collapsing them walks back into the 50,000-char ceiling the service exists to route around.

## Kill the process GROUP, not the child — and skip the signal for one that already exited

`npm run` is a wrapper; the listener is a grandchild via `sh -c`. Signalling a dead child logs
`kill ESRCH` on every clean teardown, which reads as a failure in the one log a later session opens.

## `kill` removes the throwaway home and never the evidence directory

Logs, captures and the transcript are evidence and outlive the instance.

## Evidence reads go to DISK, never down the driver socket

`start`, `run` and `kill` are the only calls that need a driver. A killed instance has no driver, and
a fixer reading one is the normal case rather than the edge. Routing a read at the socket answers a
bare connection error, which cannot be told from a crash.

## Every path handed back is repo-local, through `<repoRoot>/.siegelense`

A shot is only evidence if the reader's `Read` reaches it. Same reason `npm run prod` keeps its home
inside this repo.

## `dev:no-watch`, never `dev`, for the lane's API server

`--conditions=source` puts every `packages/*/src` file in the watcher's graph; one save anywhere
restarts the server and Vite's `/api` proxy answers with a bare 500 for ~1.5s.
