# Web Package - Claude Session Guide

## Chat-line translation: this package does NOT own it

The web is a **renderer**, not a translator. Chat entries arrive over WebSocket already
fully structured as `ChatEntry[]` from `@dungeonmaster/shared/contracts`. The web reads
the typed objects and renders them. **Do NOT parse raw stream-json, Claude CLI output,
JSONL lines, XML, or any other format on the web.** That logic lives in the orchestrator.

See `packages/orchestrator/CLAUDE.md` for the full translation funnel.

### What the web IS responsible for

- **Rendering.** React widgets that display a `ChatEntry` flatly, with sub-agent
  activity collapsed under a `SubagentChainWidget` (the one remaining grouping).
- **Grouping/layout.** `collectSubagentChainsTransformer`, `mergeToolEntriesTransformer`
  — these are pure rendering concerns: they take `ChatEntry[]` and decide how to lay them
  out. They don't parse; they restructure already-typed data.
- **User input.** Sending chat messages, clarification answers, etc., via HTTP.
- **Session routing.** URL state, session ID → active chat binding.

### What the web does NOT do

- Parse stream-json lines. (There used to be `parseUserStreamEntryTransformer`,
  `parseAssistantStreamEntryTransformer`, `mapContentItemToChatEntryTransformer`,
  `mapUsageToChatUsageTransformer`, `normalizeAskUserQuestionInputTransformer`, and
  `streamJsonToChatEntryTransformer` in `packages/web/src/transformers/`. They all live
  in the orchestrator now. Don't recreate them here.)
- Decode XML like `<task-notification>`. The orchestrator parses these into structured
  `task_notification` ChatEntries before they ship.
- Filter content. The orchestrator already strips empty-thinking items, redacted blocks,
  etc. If you find yourself writing `if (entry.content === '')` to hide an entry, ask
  whether it should be filtered upstream instead.
- Validate wire format. Entries are already `chatEntryContract`-validated by the orchestrator.
  The web can `safeParse` as a defensive check but shouldn't be transforming shapes.

### WebSocket message contracts

```
chat-output   { chatProcessId, entries: ChatEntry[] }
chat-complete { chatProcessId, exitCode, sessionId }
```

The binding (`useQuestChatBinding`) appends `entries` directly to React state — there's
no transformation layer between WS and the renderer.

**Sub-agent correlation arrives pre-converged.** The orchestrator stamps the Task's
`toolUseId` as the wire-level `agentId` on the Task's ChatEntry AND on every sub-agent
line (streaming via `parent_tool_use_id`, file via a realAgentId → toolUseId translation
map in the processor — see `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent
correlation"). The web just renders: do NOT reconcile agentIds after delivery, do NOT
add special-case logic for "real" internal sub-agent agentIds (the orchestrator would be
leaking a shape the web is not supposed to see), do NOT add a `chat-patch` WS handler.

### Sub-agent chain grouping uses toolUseId as the wire key

`collectSubagentChainsTransformer` and `indexSubagentEntriesTransformer` key on the
Task's `toolUseId`. The Task's `tool_result` entry is pinned to its chain by matching
either `e.agentId === task.agentId` or `e.toolName === task.agentId` — the latter path
covers the completion tool_result line where no parent_tool_use_id exists to stamp
agentId via the convergence.

## Every user-message injection goes through `useQuestChatBinding`

Any affordance that sends text to a running agent — the chat composer (`sendMessage`),
clarification answers (`submitClarifyAnswers`), the spec panel's queued-comment batch
(`sendCommentBatch`), and whatever gets added next — MUST call through
`useQuestChatBinding`. A widget must never call a send broker directly.

The binding does three things a bare broker call does not:

1. **Appends a synthetic user entry** to the chat panel immediately, so the message the
   user just sent is visible without a browser refresh.
2. **Owns the `questId`-scoped subscription** the reply arrives on. There is one
   `chatOutput$` subscription per bound quest, filtered by
   `p.questId === questIdRef.current || p.questId === undefined` (the second arm carries the
   `/dumpster-create` monitor-session path, which emits untagged). The send actions discard
   the broker's result entirely — routing is by quest, not by a per-send handle.
3. **Arms the running indicator**, so the control reads STOP while the turn is in flight
   rather than PLAY.

Widget → broker directly produces a silent UI: the server persists and dispatches the turn
correctly, but the panel shows nothing until a hard refresh, and the play button implies
idle while the LLM is working.

**Why the comment batch is on the binding too.** Claude's `--resume` stream never echoes the
prompt back, so a queue bar that called `questCommentBatchBroker` directly would leave the
batch it just sent invisible until a reload replays the session from disk. The server echoes
the markdown it actually delivered as `deliveredMessage`, and `sendCommentBatch` renders that
verbatim as the synthetic entry — so the optimistic entry and the replayed one match.

**Adding a new injection point:** put the send action on `useQuestChatBinding` next to
`sendMessage` / `submitClarifyAnswers` / `sendCommentBatch`, and call that from the widget.
The broker still owns the HTTP round-trip; the binding owns the panel entry, the
quest-scoped subscription, and the running state.

## `IconButtonWidget` is the only place this package constructs a Mantine `ActionIcon`

Every icon-only control goes through `widgets/icon-button/` — the comment bubble, the popover's
queue/cancel/edit/delete, the queue bar's Clear/Send, the quest-delete skull, the detail-panel
close, and the four diagram controls. Do NOT hand-roll an `ActionIcon`; a second construction site
is how the eleven call sites drifted into eleven different variant/size/colour combinations in the
first place. A grep for `ActionIcon` under `packages/web/src/**` must return exactly one widget.

- **Size** reuses Mantine's own ActionIcon enum (`xs`/`sm`/`md`/`lg`/`xl`) via
  `iconButtonSizeContract`, and `iconButtonStatics` pins which members the app uses: `sm` for
  everything, `lg` for the four floating canvas controls. Mantine's scale is 18/22/28/34/44px, so
  neither design target (20px, 32px) lands exactly — that judgement lives in the statics, with the
  glyph size for each member, so a call site picks a size and nothing else.
- **Colour** reuses `buttonVariantContract`. Omitting `variant` means `ghost`: the brown
  raised-surface fill the ABANDON text button carries. `primary` is the orange on PLAY and SEND;
  `danger` is the STOP red. Assignment follows the icon's MEANING, not its host widget — delete and
  destructive icons are `danger`, send/queue are `primary`, close and X are default.
- **Popover targets** pass through `ref`, `id`, `className` and the `aria-haspopup`/`-expanded`/
  `-controls` trio, because `Popover.Target` clones its child and injects exactly those. Drop any
  of them and the dropdown loses the element it anchors to.

## A filled comment bubble means "queued and unsent", never "has ever been commented on"

`CommentPopoverWidget` fills its bubble when the popover is open OR the box carries a queued
comment, and is hollow otherwise. Both conditions are derived on every render — `queued` comes
straight from `useCommentQueueBinding`, which every box on the canvas shares — so queueing fills
that box, deleting empties it, and SEND or CLEAR flushing the queue empties every bubble at once,
all with no reload.

**Do not give the bubble fill state of its own.** A local `hasComment` flag would go stale the
moment the queue changed anywhere else on the canvas: the queue bar's SEND and CLEAR empty the
store without touching any individual bubble, and only a derived read follows them. The same
reasoning rules out persisting "this box was commented on" — the diagram reports outstanding work,
not history, so a box whose comment was already delivered is clean.

Guarded by `flows/quest-chat/comment-bubble-fill.e2e.ts`, which counts filled vs hollow bubbles
across the WHOLE canvas rather than checking one card: a rule that fills every box, or none, passes
a single-card check and fails the count.

## `readOnly` is the ONLY thing that suppresses a diagram's comment button

A comment anchors on **flowId + nodeId (+ observableId)** — all spec data. So `QuestSpecPanelWidget`
resolves `commentQuestId` from one input and one only: `readOnly === true ? undefined : quest.id`.
No work item, no `sessionId`, no quest status, no dispatch history participates. The readOnly render
is the execution panel's QUEST SPEC tab, where the spec is approved and frozen.

**Do not reintroduce an execution-state gate here.** Tying a spec-authoring affordance to whether a
work item happens to carry a `sessionId` makes every quest minted by the `create-quest` MCP tool
(`workItems: []`) silently uncommentable, while a quest that *does* have a resumable session stays
commentable inside a frozen view — wrong in both directions at once. Same rule for the queue bar:
it renders whenever the panel is not readOnly, whatever the queue's deliverability.

Comment count badges are a READ affordance and are unaffected — `FlowsLayerWidget` takes `comments`
separately from `commentQuestId`, so prior comments stay readable in readOnly.

### The composer's running state lives in the binding — never add a widget-local copy

`useQuestChatBinding.isStreaming` is `pendingTurn || streamingFromOutput`, and the split is the whole point:

- `pendingTurn` — armed the instant the USER commits a turn, cleared ONLY by a `turn-ended`.
- `streamingFromOutput` — the agent actually emitting; cleared by any stream end.

Every widget reads `isStreaming` and calls `armStreaming` / `disarmStreaming`. **Do not reintroduce a widget-local "
submitting" flag.** `QuestChatContentLayerWidget` mounts `<ChatPanelWidget>` twice (no-quest create surface, and live
workspace) and a first message crosses from the first to the second ~20 ms after its quest is created — so a second flag
has to be threaded through both mounts identically, nothing type-checks that parity, and the mount that forgets it shows
SEND for the whole multi-second spawn window while the agent is already running. One flag in the binding has no parity
to forget. The only reason `armStreaming` is exported at all is the first message, which must create its quest before
there is a `questId` to POST to.

**The clear-input is scoped to the turn being tracked.** Every send path retains the `chatProcessId`
its POST returned (`trackedChatProcessIdRef`), and a `chatStreamEnded$` payload naming a DIFFERENT
process is ignored outright — somebody else's turn ending must not report this quest's in-flight turn
as idle. `null` means "armed with no handle yet" (the first message, and the sub-second window before
a POST resolves); an untracked turn falls back to clearing on any `turn-ended`, which is what keeps a
turn that emits nothing from sticking on STOP forever. Scope the clear; never pin the indicator on
optimistically, or a turn the harness never picked up becomes indistinguishable from a slow one.

Two failure modes this shape exists to prevent, both previously live:

1. **`chatStreamEnded$` merges two wire events.** `chat-history-complete` is the subscribe-quest replay draining and
   fires a couple hundred ms after a browser binds a quest — inside the window where a just-sent turn hasn't produced a
   token. Disarming on it reports a running turn as idle. That is why the payload carries `reason` and only `turn-ended`
   disarms. Do not collapse them.
2. **A turn that emits nothing still has to end the running state.** `chat-complete` with zero chat entries is a real
   case (a spawn that dies early). Anything gated on "output arrived" sticks on STOP forever.

Guarded by `flows/quest-chat/chat-stop-first-message.e2e.ts` — two cases, held-back output and zero output. It asserts
the recorded SEND→STOP **sequence** via `chatControlHarness`, not visibility at a moment: `toBeVisible` retries until it
passes, so a point-in-time check reports green on a control that went dark and came back on its own once output
arrived — which IS the defect.

### If you need a new field or variant

1. Add it to `chatEntryContract` in `@dungeonmaster/shared/contracts/chat-entry/`.
2. Update the orchestrator's `map-content-item-to-chat-entry-transformer.ts` (or add a new
   transformer the orchestrator's `chat-line-process-transformer.ts` calls) to produce the
   new shape.
3. Add a rendering branch in the web's `chat-message-widget.tsx` (or a new widget).
4. Add a stub in `@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub.ts` for tests.

### Critical Rules

- **Web ONLY uses session ID, NEVER quest ID.** Session ID is the sole routing/comms
  identifier for the frontend. Quest correlation happens backend-side via
  `questCreatedSessionBy` on the quest contract. Do NOT add quest ID to web brokers,
  bindings, or widgets.
- **Dungeonmaster is a dev tool / AI orchestrator**, not a SaaS product. The web UI is an
  operational RPG-themed interface, not a product page. Pixel art RPG dungeon raid aesthetic
  is the core visual identity.

## Per-tool context numbers

The Claude API does NOT return a per-tool token count for tool results. The `usage`
object on each assistant message reports `input_tokens + cache_creation + cache_read +
output_tokens` for that one API call — per-message, not per-tool. So when one assistant
turn fires multiple tools (e.g. discover + discover + Bash all in one go), the API
gives us one combined input cost; we cannot split it per-tool without server help.

What this means for the UI:

| Surface                                             | Number shown                       | Why it's accurate                                                                                    |
|-----------------------------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------|
| Tool row (`ToolRowWidget`)                          | `~X est` from result content chars | chars/4 of `tool_result.content` is per-tool and stable for relative comparison                      |
| Cumulative-context divider (`ContextDividerWidget`) | Cumulative + delta                 | Comes straight from `usage` on a single assistant entry (text or tool_use); one entry = one API call |

The chat list is flat — tool rows render inline alongside text and thinking entries,
with a `ContextDividerWidget` after each entry that has `usage` (text or tool_use). No
collapsible "tool group" wrapper. Sub-agent activity is the one exception: it stays
grouped via `SubagentChainWidget` because the Task tool_use lifecycle is a meaningful
unit, not a per-turn collapse.

Tool rows show `~X est` from chars/4 of `tool_result.content` — a per-tool estimate, NOT
a context delta. We do not put a context delta on tool rows because when one assistant
turn fires multiple tools, the API only reports one combined `usage` for that turn — the
delta cannot be split across tools. The cumulative-context divider after each entry with
`usage` carries the cross-API-call delta separately, where it can be attributed
correctly (one entry = one API call).

What we deliberately DO NOT do:

- Do not show the cumulative context as if it were a delta on the first message of a
  conversation. The divider omits the delta when there's no previous cumulative to diff
  against.

If you want a tighter per-tool number than chars/4, the only path is Anthropic's
`messages.countTokens` API — it requires a network round-trip per result, so it's
unsuitable for rendering many tool calls. Anthropic does not ship a public client-side
tokenizer for Claude 3/4. chars/4 is intentional.

Relevant files: `transformers/compute-token-annotations/`,
`transformers/estimate-content-tokens/`, `transformers/merge-tool-entries/`,
`widgets/tool-row/`, `widgets/context-divider/`,
`widgets/chat-entry-list/`, `widgets/subagent-chain/`.

## React Flow diagram sizing — four gotchas a jsdom mock hides

All four are real-browser only; `flows/quest-chat/flow-diagram-interaction.e2e.ts` +
`test/harnesses/flow-diagram/` are what actually cover them.

1. **Node overlap vs. full labels.** Cards show the whole label wrapped (no clamp) at
   `width: node.width`, so height varies. ELK lays out non-overlapping rectangles, so it must reserve
   each node's REAL height or stacked rows overlap. The elk adapter estimates height from label
   length with `elkLayoutStatics.labelEstimate`, using a deliberately LOW `charsPerLine` (18 vs the
   ~29 a 240px monospace line truly fits) so the estimate is an UPPER bound — reserved box ≥ rendered
   card, no DOM-measure two-pass needed. The estimate must be computed INLINE in the adapter's `.map`
   callback; a named non-exported helper trips the "non-exported functions forbidden" lint.
2. **Edge labels overlap because React Flow paints them at the edge MIDPOINT**, independent of ELK's
   label placement — feeding ELK `edge.labels` does not fix it. A custom edge renders the full label
   as a bounded-width wrapping HTML box via `EdgeLabelRenderer`. Bound the width and widen
   `elk.spacing.nodeNode` so sibling midpoints sit farther apart than a box. Truncation is rejected:
   edge labels have no detail panel, so chopping loses the only copy of the condition. The jsdom
   mock's `getBezierPath` must be a PLAIN function, not `jest.fn` — the global auto-reset wipes a
   `jest.fn` implementation and the custom edge's `const [path] = getBezierPath()` reads undefined.
3. **Fullscreen renders black** because React Flow's canvas is `height: 100%`, which resolves against
   the parent's `height`, NOT `minHeight`. Pin a DEFINITE height in BOTH states. A live React Flow
   instance also does not re-fit when its container resizes — remount it via a `key` that flips on the
   expand toggle.
4. **Duplicate controls.** The adapter's `<Controls>` are the actuators the custom RPG buttons
   `.click()`; keep them mounted but `display: none`. Programmatic clicks still fire on a hidden
   button.

Assertions branch RIGHT as their own always-visible `FLOW_OBSERVABLE_NODE` cards. ELK has no native
"satellite to the right" in layered/DOWN mode (edge-connected children get pushed to the next layer),
so it is custom: ELK lays out only the flow spine and the widget positions observables at
`parentX + node.width + gap`. Reserve the space by inflating each flow node's ELK **height** (not
width — width would zig-zag the spine, since ELK centers nodes) and widening `spacing.nodeNode`. The
flow-node badge counts CONTRACTS, not observables; the detail popup is contracts-only.

## Do NOT move react/@mantine from `dependencies` to `devDependencies`

`architectureProjectMapBroker` (the `get-project-map` MCP tool) classifies a package's role from its
`dependencies` — react being there is THE signal that `web` is `frontend-react`. Moving them breaks
its integration tests, and reading devDeps instead would misclassify any package that merely *tests*
React.
