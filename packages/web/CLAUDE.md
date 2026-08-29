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
   `chatOutput$` subscription per bound quest, filtered by `p.questId === questIdRef.current`
   and nothing else. The send actions discard the broker's result entirely — routing is by
   quest, not by a per-send handle.

   **Never widen that predicate to accept an untagged payload.** Two tabs open on the same
   guild are two sockets onto one server, so a frame this binding accepts without checking
   the id is another quest's transcript rendering in this one's panel — and because every
   accepted frame calls `setStreamingFromOutput(true)`, a quest parked on an approval gate
   also starts reporting itself as streaming. The server resolves the owning quest before it
   delivers (`server-init-responder`'s `workItemQuestIdCache`), so a frame arriving on a
   quest subscription always carries its id; one that does not is not addressed here.
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

**The flow tab carries the same mark, for the flows whose canvas is not mounted.**
`FlowTabQueueMarkLayerWidget` paints a filled bubble after a tab's label when that flow holds a
queued comment, derived from the same store on every render. Only the ACTIVE flow's diagram exists
in the DOM, so a comment queued on a flow the reader has tabbed away from has no bubble left to
fill, and the queue bar's count names no flow — the tab is the only surface that can say WHERE the
unsent work is. It is gated on `commentQuestId`, so the readOnly render has no marks, matching the
bubbles and the queue bar. The mark is a flex SIBLING of the label, never inside it: the tab is
`overflow: hidden` under a width ceiling, so a mark sharing the label's text run is clipped away by
the same ellipsis that shortened the name — visible only in a browser, which is why the e2e asserts
its painted position against the tab's own right edge rather than just its presence.

## The spec panel is two tabs: SPEC is a sized surface, DETAILS is a scrolling one

`QuestSpecPanelWidget` owns its own SPEC / DETAILS tab bar, and both mounts get it — quest making
(`QuestChatContentLayerWidget`) and execution (`ExecutionPanelWidget`'s QUEST SPEC tab, which
therefore stacks two tab rows). One tab bar in the widget is what keeps the two surfaces identical;
hoisting the split into the execution panel's own row would give the making surface no counterpart.

- **SPEC** = the pinned user request plus the flow view. It hands its whole remaining height down to
  the canvas (see React Flow gotcha 3 for the chain), so in a window with room it does not scroll at
  all. It carries `overflowY: auto` anyway, for the window that has NO room: the diagram refuses to
  shrink past `MIN_CANVAS_HEIGHT`, and that refusal has to become a scrollbar rather than a canvas
  clipped off the bottom of the panel. **The floor is not optional.** The panel's chrome — title
  bar, two tab rows, status line, pinned request, flow metadata, queue bar, action bar — can eat
  almost a 720px viewport, and "fill what's left" of that is one row of cards with every box below
  it unreachable, because a React Flow canvas pans instead of scrolling. Both halves are covered in
  `flow-diagram-interaction.e2e.ts`, the fill case under an explicitly taller `test.use` viewport
  because the default 1280x720 only ever exercises the floor.
- **DETAILS** = design decisions, operations, tooling — the prose a reviewer consults once. This is
  the panel's scrolling surface, and the only one; anything asserting scroll behaviour belongs here.
- **The queue bar and action bar are siblings of the tab content, not children.** Switching to
  DETAILS must never strand a queued comment batch or take APPROVE away mid-review.

The user request block is capped (`maxHeight` + `overflowY: auto`, `flexShrink: 0`) rather than
free-growing. Uncapped, a long request pushes the diagram — the thing the tab exists to show — off
the bottom, and the failure only appears for the quests whose request is long enough.

**The diagram has no fullscreen control.** It already fills its container, so a button offering to
resize it would be offering something the container already decided. `react-flow-diagram-widget.test`
asserts the control set EXACTLY (`getControlTestIds`), not as a subset, so a re-added fourth control
fails rather than slipping past a `toBeInTheDocument` check on the other three.

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

**There are TWO running states, one per composer, and a widget reads the one it belongs to.**
`isStreaming` answers "is anything on this quest running"; `isFollowupStreaming` answers "is the tavernkeeper running".
The FOLLOW-UP tab reads the second and calls `disarmFollowupStreaming`; the main composer reads the first and calls
`disarmStreaming`. Wiring that tab to `isStreaming` — which is what it did — put STOP over an agent the user had not
spoken to whenever any OTHER work item emitted, and handing it `disarmStreaming` clears a flag it does not read, so its
STOP does nothing visible.

**The FOLLOW-UP STOP posts `questFollowupStopBroker`, never `questPauseBroker`.** Pause is a QUEST-level halt: it kills
every process on the quest and flips status to `paused`. A follow-up chat only ever runs on a quest that is already
blocked/complete/merged, and `questStatusTransitionsStatics`
makes that flip ILLEGAL from `complete` and `merged` — so the old wiring errored after the kill — and LEGAL from
`blocked`, where it succeeded and silently took the whole quest along with the tab the reader was using, since `paused`
is not follow-up-chatable. The dedicated route kills the tavernkeeper's own process by work item and writes nothing, so
the conversation stays resumable. Guarded by `quest-chat-content-layer-widget.test.tsx`, which asserts the pause route's
request count is 0 alongside the stop route's 1 — the half that catches a regression back to the old wiring.

The pair is mirrored rather than generalised into a per-work-item map on purpose: the main pair's arm/disarm timing is
load-bearing (the two failure modes below), and one shared structure would have re-derived it for both at once.
`sendFollowupMessage` therefore arms ONLY the follow-up pair and retains its own `chatProcessId`; a follow-up POST
writing the shared handle would retarget whichever turn the main composer had in flight, so that turn's own completion
would then read as foreign and never clear it.

**Route the follow-up's output arm by `workItemId`, and set that id from the WIRE.** The tavernkeeper work item is
stamped on the quest, so it survives a reload where a `chatProcessId` this browser issued does not. The id ref is
written inside the quest-updated handler rather than synced on render because the frame that MINTS the work item and
that work item's first `chat-output` can arrive in one React batch — no render happens between them, so a render-synced
ref is still null when the output it routes arrives, and the composer misses the opening of its own turn. Covered by
`use-quest-chat-binding.test.ts` → "the FOLLOW-UP running state is scoped to the tavernkeeper" and, at the
rendered-control level, by `quest-chat-content-layer-widget.test.tsx`'s non-tavernkeeper streaming case.

**A REPLAYED frame never arms the indicator.** `chat-output` carrying `replay: true` is a transcript being read back off
disk — `ChatReplayResponder` is its only emitter and stamps every frame it sends. The binding upserts those entries (the
transcript has to RENDER) and then returns BEFORE
`setStreamingFromOutput(true)`. Do not drop that guard, and do not re-derive it from the
`quest-replay-` chatProcessId prefix — that is the server's id-naming convention and the browser has no business reading
it.

The reason is the shape of a `subscribe-quest` replay: it replays EVERY work item, and each one ends with its own
`chat-history-complete`. So without the guard the flag alternates arm→disarm once per work item. Measured on a
31-work-item quest: 28 `chat-history-complete` frames in 3.1 s of wall clock, and the FOLLOW-UP tab's composer — the
only surface mounting the control during the execution phase — strobed SEND↔STOP 35 times with nothing running and no
message sent. Guarded by
`use-quest-chat-binding.test.ts` → "replay-flagged chat-output does not arm the running indicator", which records the
control state after EVERY frame rather than once at the end: the last frame of a replay burst is a disarm, so a single
check once the burst has drained reads false whether or not the bug is present.

Two further failure modes this shape exists to prevent, both previously live:

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

## A collapsed tool row is ONE line, and its label names the action

`ToolRowWidget` puts the label, the params summary, the `~X est` token badge and the status glyph
all in the header button. That is the invariant: a reader skimming a long run counts calls by
counting lines, so anything wanting a second line goes behind the disclosure instead. Guarded by
`widgets/tool-row/tool-row-widget.test.tsx`, which asserts the row's ONLY child is
`TOOL_ROW_HEADER` — a check on badge placement alone passes on a row that grew a third element.

**That chevron is the ONLY disclosure, and an open row shows its result WHOLE** — no "show full
result", no capped inner scroller. Both were there and both are gone: a second collapse re-asks the
question the reader answered by opening the row, and a `maxHeight` + `overflow: auto` on the body
defeats the sticky header below, which pins only while the row's content scrolls in the PANEL. The
scroller rode on a wrapper `<Box>` rather than on the body, so the test asserts `TOOL_ROW_RESULT`'s
children are exactly `[label, body]` — a re-added wrapper reappears as an extra untagged child long
before anyone thinks to check a style.

**The disclosure follows the stream; it does not latch.** `ChatEntryListWidget` raises
`defaultExpanded` on the ONE call that is currently in flight (`isLastUnpaired`), and `ToolRowWidget`
derives `expanded` from that prop every render — the reader's click is the only thing stored. So the
row opens while the call runs, closes itself when the result lands, and a screen of finished calls is
one line each whether the reader watched them arrive or opened the transcript afterwards. Storing the
auto-expand in `useState` instead is the bug this shape exists to prevent: `useState` only reads its
argument on mount, so every call that ever streamed stays open for the rest of the session and the
chat becomes a wall of expanded tool detail. Guarded in both places — the widget test rerenders
`defaultExpanded` true → false, and `chat-entry-list-widget.test.tsx` asserts that in a streaming
list only the in-flight row carries a `TOOL_ROW_DETAIL`.

The bold slot shows what the agent DID, not which harness tool carried it, because the raw name
mostly does not distinguish anything: every shell call is `Bash` and every MCP call is
`mcp__server__tool`, so a screen of either reads as one repeated word.
`toolDisplayLabelTransformer` derives `git diff` / `npm run ward` from the command, strips the MCP
server prefix, and leaves everything else alone.

The dim slot is `toolRowSummaryTransformer`, which shortens paths before truncating — elision is
what buys the width, so `git diff -- a b c` shows three arguments where the raw form was cut off
inside the first. **Shortening is collapsed-only.** `web/…/tool-row-widget.tsx` names a file to a
human and no longer resolves to one, so the expanded detail renders `formatToolInputTransformer`
output untouched. Do not shorten in the detail, and do not feed `ShortenedPathText` to anything
that opens, compares, or resolves a path.

## `MarkdownTextWidget` is the only place agent-authored markdown is rendered

Models emit markdown, so the assistant `text` branch of `ChatMessageWidget` renders through
`MarkdownTextWidget`, and so does a tool result that turns out to be markdown (via
`ToolResultContentWidget` — see below). Everything the APP itself composes stays plain `<Text>` —
there, markdown characters are literal and formatting them would misreport what the agent said.

The dialect is closed on purpose (headings, fences, lists, quotes, rules; code / bold / italic /
link inline) and is parsed in this package rather than by a markdown npm package, because
`widgets/` may only import the packages in `folderConfigStatics`. Adding a renderer library means
editing that allowlist in `@dungeonmaster/shared` plus a jsdom mock — at which point the widget
tests assert against the mock, not the rendering.

Two rules the parsers exist to hold, both covered in their `.test.ts`:

1. **Code claims its content before any other mark sees it.** `parseMarkdownSpansTransformer`
   scans code → link → bold → italic in one pass, so a backticked glob full of asterisks renders
   as a glob. Reordering the alternation turns it into a bold run.
2. **Paragraphs buffer across lines.** `parseMarkdownBlocksTransformer` rejoins consecutive prose
   lines, so a model that hard-wraps does not render with a break at every wrap point. Per-line
   parsing looks correct on unwrapped output and shreds wrapped output — only something holding a
   buffer can tell a wrap from a deliberate blank line.
3. **…except where the newlines ARE the structure**, which is what `preserveLineBreaks` is for.
   Agent prose wraps; TOOL OUTPUT does not — `get-quest` puts one contract per line with its
   properties indented beneath it, however long the line runs, and rejoining that produced a single
   run-on sentence with every nesting level flattened out. The flag keeps the buffer (so blank lines
   still separate paragraphs and the spacing is unchanged) and only swaps the join to `\n` and stops
   trimming. `ToolResultContentWidget` raises it; the assistant `text` branch never does.
   `MARKDOWN_PARAGRAPH` therefore carries `whiteSpace: 'pre-wrap'` — inert on a rejoined paragraph,
   which is already one line of single-spaced words, and load-bearing on a preserved one. Assert the
   style, not just `textContent`: `textContent` reports newlines the CSS would collapse, so a
   missing `pre-wrap` renders one line while every text assertion still passes.

An unterminated fence renders as a code block rather than being dropped: that is the normal shape
of a message still streaming.

**A heading is separated by the space ABOVE it and a rule UNDER it, never by size.** The size ladder
in `markdownTypographyStatics` tops out three points over body and flattens entirely at `####`, and
that stays — a document-scale `h1` out-shouts the role label above it in a narrow panel. But it
leaves the eye nothing to catch: a `##` at 14px in body colour, sitting the same 4px off the
paragraph before it as that paragraph sat off the one before THAT, is a bold line, not a section.
`headingGapTop` opens the section and `headingRuleMaxLevel` puts a hairline under `#` and `##` only.
The gap is suppressed on the first block (`isFirst`, passed by `MarkdownTextWidget`) or every tool
result opens on a band of empty space. **Reach for those three values before reopening the ladder** —
buying a `##` presence with points is the thing the ladder exists to refuse.

**That rule is `text-dim`, and `border` is the trap.** `border` is what `MARKDOWN_RULE` uses and
reads as the matching token for a divider, but the two marks are not in the same situation: a `---`
is alone on its line with air either side, while this sits tight under glyphs. Measured against the
surfaces markdown actually renders on, `border` is 1.37:1 over `bg-surface` and 1.23:1 over the
`bg-raised` of an open tool row — the same range this palette already documents below as
"technically painted and perceptually absent". `text-dim` is 3.71:1, and is already the token doing
exactly this job as the code chip's outline. The failure mode is the chip's, exactly: every test
passes while the line is not there, which is why `markdown-block-layer-widget.test.tsx` asserts the
rule's COLOUR rather than its presence.

**Inline code is marked by its chip, not by colour — and the chip is LIGHTER than the message.**
Agents backtick constantly (identifiers, paths, file:line refs, flags), so an accent on the code
span fires a dozen times per message and the prose reads as highlighter. `bg-raised` carrying body
text does the marking instead. Both halves are asserted in `markdown-span-layer-widget.test.tsx`,
because each has an obvious-but-wrong instinct behind it: "make code stand out" gives you the
highlighter, and "code sits in a well, so use `bg-deep`" gives you a chip a single shade off the
`bg-surface` it renders over — invisible in the browser while every test still passes. Links keep
`primary`; those are rare enough to earn a colour.

## A tool result is drawn by `ToolResultContentWidget`, and its default is to change nothing

Two surfaces show a tool's answer — `ToolRowWidget` and the unpaired-result branch of
`ChatMessageWidget` — and both hand the content to `ToolResultContentWidget` rather than to a
`<Text>` of their own. Do NOT render `toolResult.content` directly, and do NOT reach for
`MarkdownTextWidget` here: that widget assumes its input IS markdown, and a tool result is a build
log or a diff at least as often.

**Only `ChatMessageWidget` still truncates a result, and the asymmetry is the point.** A tool row is
collapsed to one line by default, so its chevron already IS the disclosure and a second "show full
result" inside it re-asks a question the reader answered by opening the row. An unpaired result has
no row and no chevron — it renders flat in the transcript — so it keeps the string truncation, or an
unbounded blob lands in the middle of the chat with nothing to fold it back up.

`parseToolResultDisplayTransformer` decides, and it DECLINES for most replies — measured over 69,706
captured tool results, 87% render byte-identical to before. Two shapes get help:

1. **A JSON reply with an escaped document inside it.** `get-agent-prompt` returns
   `{name, model, prompt}` where `prompt` is a whole agent prompt, and `discover` returns
   `{results, count}` where `results` is a folder tree — both reach the browser with every newline
   printed as the two characters `\` and `n`, which no panel width fixes. Each property becomes its
   own unit: scalars inline as `key: value`, multi-line ones get a caption and real line breaks.
   A truncated preview declines on its own, because half an object does not parse — which is what
   lets `ChatMessageWidget` keep string truncation without the two features having to know about
   each other.
2. **A body authored as markdown** — the MCP doc tools, sub-agent reports, plan text.

Both render through `MarkdownTextWidget` with **`preserveLineBreaks` raised** — see the markdown
section above. A tool's answer is machine-formatted, so its newlines and indentation say where one
logical item ended and which continuations belong to it; the rejoining that serves an agent's
hard-wrapped prose destroys exactly that.

**`isMarkdownContentGuard` counts only a heading or a fence at column ZERO, and that narrowness is
load-bearing.** The block parser rejoins consecutive prose lines into one paragraph, so a log
misread as markdown loses its line structure — the reader loses the only copy of the output. Every
softer mark occurs in raw output by accident: a removed diff line reads as a bullet, `---` reads as
a rule, an npm script echo reads as a quote. Column zero specifically excludes a diff OF a markdown
file, whose context headings all sit one column in behind the diff's own gutter. Against the same
69,706 results this leaves 0 `Read` results and 2% of `Bash` results formatted, and most of that 2%
is agents printing deliberately markdown-headed diagnostics. The known residual is `cat`ting a file
whose `#` comments start at column zero; widening the marker set trades that one case for every
diff and build log in the transcript.

## Every expand/collapse in the transcript obeys ONE rule: the control you clicked stays put

`useDisclosureAnchorBinding` owns it, and every disclosure calls it — `ToolRowWidget`'s header and
its per-field show-more, `SubagentChainWidget`'s header, `ShowEarlierToggleWidget` (which owns the
binding itself, so both its call sites are covered at once), and `ChatMessageWidget`'s truncation
toggle. **Adding a new expandable means calling `holdAnchor()` in its click handler and putting
`anchorRef` on the control**, before the state change. Anchor the ONE element there is exactly one
of: `ToolRowWidget`'s field toggles anchor the row HEADER, because several fields can carry a
toggle and a callback ref keeps only the last.

It does two things, and neither works without the other:

1. **Restores the anchor's offset inside its scrollport**, in a `useLayoutEffect` so it lands before
   paint. `computeAnchorScrollTopTransformer` diffs the anchor's CURRENT offset against the
   remembered one rather than tracking how much taller the page got — which is what makes it
   self-correcting when something else moved the scrollport in between.
2. **Holds `useAutoScrollBinding` down** via `disclosureAnchorState`. That binding's `ResizeObserver`
   sees the transcript change height but never WHY, so it read a reader opening a sub-agent chain as
   new output arriving and jumped to the bottom — which is the whole reason expanding a chain or
   clicking "Show N earlier" used to dump you at the end of it.

**The hold is released two animation frames later, and scheduled inside `holdAnchor` rather than in
the layout effect.** Both halves are load-bearing. Two frames: a `ResizeObserver` callback for this
mutation runs after the layout effects AND after that same frame's first rAF, so anything sooner
hands the auto-scroll the very resize the hold exists to suppress. Inside `holdAnchor`: a component
that unmounts itself by toggling never runs its effect, and a hold nothing releases disables the
auto-scroll for the rest of the session.

**Collapse is the case that needed the arithmetic**, and it works because of the sticky headers: a
row's header pins to the top of the scrollport while it is open, so the offset being restored is the
pinned one, and restoring it reads as "take me back to what I just collapsed". Expanding a chain
needs no arithmetic at all — everything inserts BELOW the header — so for that case the fix is
entirely the hold.

**jsdom cannot see any of this.** It has no layout, so `getBoundingClientRect` is all zeros and the
`ResizeObserver` is a no-op stub (`__mocks__/jsdom-polyfills.cjs`). The unit tests therefore cover
the two halves that ARE observable — `compute-anchor-scroll-top-transformer.test.ts` for the
arithmetic against real numbers, and a per-widget assertion that clicking takes the hold. Nothing
below Playwright proves the scrollport actually moved.

## `AppRootWidget` is where global CSS lives, because inline styles cannot express a pseudo-element

This package has no stylesheet — every surface is a React inline style. That works until a rule has
no element to hang off, at which point `AppRootWidget` renders a `<style>` built from
`emberDepthsThemeStatics`, so the palette stays the single source of truth. Put a rule there only
when it genuinely has no element: `::selection`, `::-webkit-scrollbar`, `@keyframes`. Anything that
could be an inline style on a widget belongs on that widget.

`::selection` is the current occupant. Undeclared, Chrome paints its own blue — off-palette against
every warm surface here, and it recolours the FOREGROUND too, so body text lands on saturated blue
and the identifier you were trying to copy becomes the least legible thing on screen. Both halves
are set (primary fill, `bg-deep` glyphs) and both are asserted, because fixing only the background
leaves the contrast problem untouched.

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

**A run of back-to-back tool calls carries ONE divider, at the end of the run.** A rule between
every call in a ten-call run is noise; what the reader is after is what the run cost before the
model spoke again. `computeTokenAnnotationsTransformer` implements this by handing a `null`
`cumulativeContext` to every call whose next item is a tool-pair on the same source — a null
cumulative is what the list widget reads as "no divider here" — and, crucially, by NOT advancing
`prevSessionContext` / `prevSubagentContext` for those calls. That second half is the whole point:
advance it and the surviving divider reports only the last hop (`+250`) while the run actually
consumed `+700`, so the cumulative jumps by an amount the delta never explains. The two sources are
compared before collapsing, so a sub-agent call never ends a session run.

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

## React Flow diagram sizing — six gotchas a jsdom mock hides

All six are real-browser only; `flows/quest-chat/flow-diagram-interaction.e2e.ts` +
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
3. **The canvas renders black whenever any link above it has an indefinite height**, because React
   Flow's canvas is `height: 100%`, which resolves against the parent's `height` — NOT `minHeight`,
   and NOT a flex-basis. The diagram is sized BY its container, so the whole chain is load-bearing:
   `QUEST_SPEC_PANEL` → the SPEC tab → `FLOWS_LAYER` → `FLOW_TAB_PANEL` → the diagram box →
   `FLOW_DIAGRAM` → `FLOW_DIAGRAM_CANVAS_WRAPPER`. Every link is `flex: 1` + `minHeight: 0` (the
   `minHeight` is what lets it shrink — a flex item's default `min-height: auto` floors it at content
   height, so the canvas would size the panel instead) EXCEPT `FLOW_DIAGRAM`, which carries
   `minHeight: MIN_CANVAS_HEIGHT` and is the one link that refuses to shrink. **Do not give the
   wrapper a `height` of its own** — that is what re-pins the canvas to a fixed box and stops the
   panel deciding. Guarded by `canvasFillsPanelBelowRequest` in `test/harnesses/flow-diagram/`, which
   measures the canvas against the panel's own bottom edge; a jsdom assertion on the style alone
   cannot tell you the chain resolved.
4. **Duplicate controls.** The adapter's `<Controls>` are the actuators the custom RPG buttons
   `.click()`; keep them mounted but `display: none`. Programmatic clicks still fire on a hidden
   button.
5. **A node's measurement is taken ONCE, and losing it costs you every edge.** `adoptUserNodes` keeps
   `measured` + `internals.handleBounds` only while the node OBJECT stays reference-identical; a fresh
   object resets both. A card is a fixed box, so its ResizeObserver delivers one initial notification
   and never fires again. An unmeasured node has no handle bounds, and React Flow drops every edge
   touching one — silently. The symptom is therefore "the cards are fine, the LINES are missing", which
   points nowhere near measurement. Two things hold it: `nodes`/`edges` are `useMemo`d in
   `react-flow-diagram-widget.tsx` (which is why the early returns sit BELOW the memos, and why the
   empty-array prop defaults are module constants), and `node-measure-layer-adapter.ts` re-measures
   from the DOM whenever React Flow reports `nodesInitialized === false`. The memo alone is not enough:
   a `quest-modified` over the websocket is a genuine content change, so it busts any memo, and it
   arrives during exactly the frame the first measurement lands in.
6. **Everything that floats over the canvas is `position: absolute` against `FLOW_DIAGRAM`** — the
   node detail panel (top right) and the zoom/fit controls (bottom left). The canvas wrapper is the
   only in-flow child, so it always has the full width. A detail panel rendered as a flex SIBLING
   takes 280-400px out of a spec panel that may only be ~600px wide, and the React Flow viewport does
   not re-frame when its container narrows — so the graph the reviewer was reading slides out of the
   strip that is left and they are looking at a blank canvas with a panel on it. Guarded by
   `nodeGeometryMatchesCapture`, which asserts every card is at the SAME coordinates after a box is
   selected; a check that some card is still visible passes on the arrangement that loses most of
   them.

Assertions branch RIGHT as their own always-visible `FLOW_OBSERVABLE_NODE` cards. ELK has no native
"satellite to the right" in layered/DOWN mode (edge-connected children get pushed to the next layer),
so it is custom: ELK lays out only the flow spine and the widget positions observables at
`parentX + node.width + gap`. The flow-node badge counts CONTRACTS, not observables; the detail popup
is contracts-only.

**A column is invisible to ELK, so its space is reserved on two axes by two different mechanisms,
and BOTH have to hold.** Height: inflate the owning node's ELK box to the column's height (not its
width — width would zig-zag the spine, since ELK centers nodes in their layer). Width: `spacing`,
and it takes **two** knobs, not one. `spacing.nodeNode` holds off a neighbouring CARD;
`spacing.edgeNode` holds off the dummy ELK layered splits every multi-layer edge into, and a layer
that a long edge or back-edge crosses has one of those between its cards — so that pair is spaced by
`edgeNode` (twice, either side of the zero-width dummy) and `nodeNode` never applies to it, however
large it is. Size only `nodeNode` to the column and every flow carrying a back-edge paints assertion
cards on top of node cards; `elk-layout-statics.test.ts` pins the min of the two against
`observable.gap + observable.width`.

Per-node ELK options are the shape this wants and elkjs does not implement them: `elk.margins` /
`org.eclipse.elk.margins`, `spacing.individual` and `nodeSize.minimum` were each measured leaving
the layout byte-identical, so don't reach for them again. Real ELK is also mocked in jest
(`^elkjs$` → `__mocks__/elkjs-mock.cjs`), so no unit test can catch a spacing regression by laying a
graph out — the statics invariant is the guard.

## Do NOT move react/@mantine from `dependencies` to `devDependencies`

`architectureProjectMapBroker` (the `get-project-map` MCP tool) classifies a package's role from its
`dependencies` — react being there is THE signal that `web` is `frontend-react`. Moving them breaks
its integration tests, and reading devDeps instead would misclassify any package that merely *tests*
React.
