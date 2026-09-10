# Transcript gaps: where a session ran, and who knows it

Two gaps, both about the same thing — the directory a Claude session's JSONL is written under. One is
live and measured today. The other is not real yet and becomes real the moment a sub-agent gets its
own worktree.

---

## Gap 1 — a quest has ONE recorded cwd, but its sessions ran in several

**LIVE. Measured on quest `c8171a64` in this repo.**

### The symptom

The ChaosWhisperer row in the execution panel is empty. Expanding it shows nothing, and a reload does
not fill it. Every row after the carve renders fine.

### The cause

`questCwdResolveBroker` takes a **questId** and returns **one** cwd for the whole quest. Once
riftcarver has carved, that answer is the worktree — for every session on the quest, including the
ones that ran before the worktree existed.

Claude CLI encodes its session-JSONL directory from the child's own cwd, so the sessions are split
across two directories. Measured on `c8171a64`:

| Session | Role | JSONL lives under |
|---|---|---|
| `e0047cb8` | chaoswhisperer | the **guild** path encoding |
| `8e4e1efe` | codeweaver | the **worktree** path encoding |
| `99bba2ad` | flowrider | the **worktree** path encoding |
| `82f03a2d` | siegemaster | the **worktree** path encoding |

One resolution, two directories. Whichever it picks, the other group is unreachable — and because
`worktreePath` is set, it picks the worktree and ChaosWhisperer's intake conversation is lost to both
the live tail and the replay.

**The one-line statement: a cwd is a property of the SESSION, not of the quest.** The intake
conversation runs in the user's own checkout; every role after the carve runs in the worktree.

### Where it is wired

| File | What it does |
|---|---|
| `packages/orchestrator/src/brokers/quest/cwd-resolve/quest-cwd-resolve-broker.ts` | Takes a questId. Returns the worktree once carved, the repo root otherwise. The single source both read paths use. |
| `packages/orchestrator/src/brokers/chat/history-replay/chat-history-replay-broker.ts:102` | The REPLAY path. Resolves per quest, so it reads a pre-carve session from the worktree encoding and finds nothing. |
| `packages/server/src/responders/quest-driven-watchers/bootstrap/reconcile-watchers-layer-responder.ts:97-107` | The LIVE TAIL. Computes one `questProjectDir` per quest, then records it per session first-writer-wins. |

Note the split in what the call sites are actually asking. Most of them ask **"where does the next
thing run?"** — spawning an agent, running ward, carving a branch — and for those the per-quest answer
is correct. Only the two READ paths ask **"where did this session already run?"**, and that question
has a different answer per session.

### The direction

**Record each session's own cwd when the session is stamped, and have the two read paths use it.**

`startRef` on `work-item-contract.ts:48-55` is the precedent to copy, in shape and in reasoning:
stamped once at the moment the item is first served, never rewritten, `.optional()` with **no
default** so every item seeded before the field simply carries none and absence survives a round
trip.

1. Add a per-work-item field for the cwd its session ran in, alongside `sessionId`.
2. Stamp it wherever `sessionId` is stamped — the node dispatcher's spawn batch, and the MCP
   `get-agent-prompt` path that stamps `sessionId`/`agentId` for Task-dispatched agents.
3. Have `chatHistoryReplayBroker` and `reconcileWatchersLayerResponder` read that field per work
   item, falling back to the current per-quest resolution when it is absent.
4. Leave every spawn-side caller of `questCwdResolveBroker` exactly as it is. They are asking the
   other question and the per-quest answer is right for them.

Do NOT make `questCwdResolveBroker` itself per-session. It is the "where does this quest run" broker
and a dozen spawn sites depend on that meaning.

### Tests to write

- An e2e mirroring `role-transition-streams-live.e2e.ts`, from the other side: a carved quest whose
  chaoswhisperer session was recorded under the GUILD encoding, assert that row's text renders. It
  fails today.
- The same assertion after a reload, since replay and live tail resolve through different code and
  both are wrong in the same direction.
- A unit test that a work item stamped with one cwd keeps it when the quest's `worktreePath` later
  changes — the `startRef` "written once, never rewritten" property.

---

## Gap 2 — sub-agents in their own worktrees

**NOT REAL YET.** This is what breaks if sub-agents stop sharing the parent's cwd.

Today a Task-dispatched sub-agent runs inside the parent session's process and cwd. Its JSONL lands
at `<parentSessionDir>/subagents/agent-<id>.jsonl`, and the watcher finds it by scanning that
directory. One project dir per session, and the sub-agent inherits it.

Give each sub-agent its own worktree — separate work, merged back into the quest's first-cut worktree
— and three things break at once:

| Where | What breaks |
|---|---|
| `reconcile-watchers-layer-responder.ts:105-107` | `projectDirBySessionId` holds ONE dir per session, first-writer-wins. Nowhere to record a second. |
| `reconcile-watchers-layer-responder.ts:101-104` | The tail target set is built from `workItems[].sessionId`. A sub-agent has no work item, so nothing would ever start a tail for its session. |
| `scan-subagents-dir-layer-broker.ts:100` | Reads only `<parentSessionDir>/subagents/`. A sub-agent in worktree B writes under B's encoding — a different `~/.claude/projects/` directory entirely. |

`role-transition-streams-live.e2e.ts` would stay green through all of it. It asserts one work item,
one session, one worktree.

### A latent trap to know about now

`packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.ts:60-68` resolves the
sub-agent JSONL from `guild.path`, hardcoded, with no worktree fallback. That is the same defect Gap 1
describes.

It is safe today for one reason only: the node dispatcher never feeds child stdout into the chat
pipeline (`spawn-one-agent-layer-broker.ts:116`), so that broker serves only sessions that really do
run at the guild path. Route a carved quest's sub-agent through it and it breaks silently.

### The direction, when you build it

The tail model has to move from one dir per session to one dir per **agent session**, and discovery
has to stop being "scan the parent's subagents dir". Gap 1's fix is the foundation — once a cwd is
recorded per session rather than per quest, a sub-agent session is just another session with its own
cwd.

Then the tests are: a sub-agent in worktree B, assert its text reaches the parent's chain live with no
reload; and a second asserting that merging B back into the first-cut worktree does not strand its
transcript.
