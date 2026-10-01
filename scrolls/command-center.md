# Command Center: the root page redesign

This is the feature list for the redesigned root page (`/`). It is a planning doc, not a quest. Quests get cut from it later.

The clickable prototype is the "Command Center" page in the design app. Run `cd scrolls/design && npx vite` and open http://localhost:4000. The page code is `scrolls/design/pages/command-center.jsx`. Mock data only. The exhaustive working inventory this doc was written from, with every label and pixel value, is `scrolls/design/COMMAND-CENTER-BEHAVIOUR.md`.

**How to read the sections.** Each section says what the part is for, then lists:

- **States:** every distinct way it can look.
- **Interactions:** what happens when the user does something, written "user does X → Y happens".
- **Rules:** what must always hold.
- **Later:** what ships after the first round.

## The layout rule

**The left side is filtered by the selected guild. The right side is global, whatever guild is selected.**

| Region | Scope | What it holds |
|---|---|---|
| Header | global | Logo, the header chip, the health strip |
| Left column | picks the filter | ALL GUILDS, the guilds, ALL SESSIONS, and the DEVOUR toggle |
| Middle column | selected guild | The QUESTS, BOUNTY BOARD and SESSIONS tabs, with the steward chat at the bottom |
| Right column | global | The RAID panel: every quest that needs the user, is running, or is queued |

A drag handle sits between the middle and the right column.

The page has three modes.

| Mode | Middle | Right |
|---|---|---|
| Command center (default) | Tabs and the steward | The RAID panel |
| Quest mode | One quest's chat | That quest's spec panel |
| Bounty mode | One bounty's Sparkwright chat | That bounty's document |

"← COMMAND CENTER" or Esc leaves quest mode and bounty mode. The header and the left column exist in every mode.

## 1. Header

**Purpose:** the always-visible summary of the whole system: what is waiting, what is running, and whether the machinery is healthy.

### 1.1 Logo

- Half the height of today's logo, because the page wants density. It has no interactions.

### 1.2 Header chip

**States:**

| State | When | Shows |
|---|---|---|
| Hidden | The RAID list is on screen | nothing, so it never repeats the panel |
| Shown | Quest mode, bounty mode, or the RAID panel showing a focused item | "⚔ 6 need you · 4 running · 5 queued" and a small PAUSE or PLAY button. "need you" is red when above zero. |
| Shown, narrow screen | Under about 1400px wide | an abbreviated form, "⚔ 6 need · 4 run · 5 q", so the header stays on one row |

**Interactions:**

- User clicks the chip → the RAID list slides in from the right edge over the current view (section 8). The current view does not move or change.
- User clicks PAUSE or PLAY → dispatch pauses or resumes. The slide-over does not open.
- User hovers the chip → the tooltip names the open quest or bounty, if there is one.

**Rules:** the counts are live. "Need you" counts the NEEDS ATTENTION lanes, "running" counts the ACTIVE lanes, and "queued" counts the QUEUED lanes.

### 1.3 Health strip

**States:**

- Dispatch state with the slots in use, for example "● dispatch 3/4", or "● paused 3/4" in amber.
- Claude's 5-hour rate-limit window as a bar and a percentage. The colour is red at 80% and above, amber at 50% and above, and dim below that.
- One dot per local model backend: green when up, amber when degraded. The names show beside the dots on wide screens.
- Server errors in the last hour, for example "⚠ 23 err/1h". **Later.**
- The strip's border turns gold while the health view is showing.

**Interactions:**

- User clicks the strip while the RAID list is showing → the right column switches to the health view (section 7.6).
- User clicks the strip in quest mode, bounty mode, or a focused view → the health view slides in over the right side (section 8).

## 2. Left column: guilds

**Purpose:** pick which guild the middle column shows. Get to sessions. Make room for the middle when wanted.

**Layout, top to bottom:** a header with GUILDS and +, ALL GUILDS, a divider, one row per guild, empty space, ALL SESSIONS, the DEVOUR toggle.

**States:**

| State | Shows |
|---|---|
| Expanded | Each row is an icon square plus text. ALL GUILDS uses a castle-gate icon. A guild's icon is its initials with up to 4 dots for active quests. Beside each icon: the name and "N active · M bounties" ("1 bounty" when singular). The selected row is gold. |
| Collapsed (the rail) | Icons only. ALL SESSIONS becomes an icon. In a detail view, the open quest's or bounty's guild is outlined in gold. |

**Interactions:**

- User clicks a guild → it becomes the selected guild. The middle column re-filters. The steward uses that guild by default. In a detail view this also leaves the detail view.
- User clicks ALL GUILDS → the middle column shows every guild, and each row gains a "guild /" prefix.
- User clicks ALL SESSIONS → ALL GUILDS is selected and the middle switches to the SESSIONS tab. In a detail view this also leaves the detail view.
- User clicks + → adds a guild, as today.
- User clicks "▶ DEVOUR ◀" (expanded) → the column collapses to the rail in place, and the middle column widens.
- User clicks "◀|▶" (collapsed) → the column expands in place.

**Rules:**

- **No button ever moves vertically.** ALL GUILDS, each guild, ALL SESSIONS and the toggle keep the same position, expanded or collapsed, in every mode and at every screen size.
- The DEVOUR toggle works in every mode.
- The collapsed or expanded choice is remembered across reloads. Two separate choices are kept: one for the command center, which defaults to expanded, and one for quest and bounty mode, which defaults to collapsed.
- "Active" counts quests that are not complete or abandoned. "Bounties" counts live bounties only.

## 3. Middle column: tabs

**Purpose:** everything belonging to the selected guild.

**Layout:** "FILTERED BY <guild>", the tab bar, the tab's content, then the steward chat (section 4). The content shrinks as the chat grows.

### 3.1 Tab bar

- The tabs are QUESTS, BOUNTY BOARD (N) and SESSIONS. N counts the live bounties in the current filter.
- A + at the right end creates whatever the active tab lists: a quest, a bounty, or a session.
- Every tab's list ends in a quiet hint line:

| Tab | Hint |
|---|---|
| QUESTS | "+ start a quest, or tell the steward what you need" |
| BOUNTY BOARD | "+ add an idea, or tell the steward" |
| SESSIONS | "sessions appear here as agents run" |

### 3.2 QUESTS tab

**Row layout:**

1. The status in a tag box on the left, in the status colour.
2. The title, with a "guild /" prefix when ALL GUILDS is selected.
3. Right-aligned progress figures, with no animation: the current role, "items 5/9" with a small bar, the elapsed time, and the token figures (section 10).

**States:**

| State | Shows |
|---|---|
| Running | The role in colour, a live elapsed time, and the context and total tokens |
| Finished | The final elapsed time and final totals |
| Not started or waiting | "—" in place of role, time and context |
| Abandoned | The row is dimmed, with the title struck through |
| Narrow screen | The figures drop to a second line under the title |
| Empty guild | "No quests yet" |
| Epic | A collapsible group row (section 11) |

**Status colours:**

| Statuses | Colour |
|---|---|
| created, pending, explore_*, flows_approved, paused | amber |
| review_flows, review_observables | gold |
| approved | magenta |
| in_progress, merging | orange |
| complete, merged | green |
| blocked | red |
| abandoned | dim |

**Interactions:**

- User clicks a quest row → quest mode opens for that quest (section 9).
- User clicks an epic's ▾ or ▸ → the epic's steps collapse or expand. Nothing else happens.
- User clicks elsewhere on an epic row → the right column focuses the epic (section 7.7).

### 3.3 BOUNTY BOARD tab

**Purpose:** every piece of starter information captured before a quest exists, in one list.

**The record:**

| Field | Values |
|---|---|
| kind | IDEA (gold), DEFECT (red), FOLLOW-UP (magenta) |
| origin | you, steward, tavern (a tavernkeeper), srv-err (a captured server error) |
| state | live, promoted (links to its quest), abandoned (kept, never deleted) |
| content | one markdown document, with screenshots inside it |

**Row layout:** the kind tag, then the title (the document's first line), then the state, origin and age on the right.

- A defect that merged repeats of the same server error shows a count after its title, for example "×14".
- A promoted row shows "↗ <quest title>" as its state.
- An abandoned row is dimmed, with the title struck through and the state "ABANDONED".

**Interactions:**

- User clicks a kind chip (IDEA, DEFECT, FOLLOW-UP) → the list filters to the chosen kinds. Several chips can be on at once. "clear" turns them all off. With none on, every kind shows.
- User clicks a row → bounty mode opens for that bounty (section 13).

**States:** populated; filtered to nothing ("Nothing on the board"); rows in each of the three states.

**Rules:** the idea quest `e87996cb-b86e-4bec-97bc-3e6f0b299542` gets widened to this record before it starts. Today it specifies ideas only.

**Later:** rows with origin tavern or srv-err, and the ×N merge count.

### 3.4 SESSIONS tab

- A row shows the summary, a QUEST chip when the session belongs to a quest, the status, and the age.
- A session with no title shows "Untitled session".
- **Interactions:** none designed yet. Today's session view behaviour stays.

## 4. The steward chat

**Purpose:** a project-manager agent the user talks to about every guild's quests, and which acts on them.

**States:**

| State | Shows |
|---|---|
| Empty | Just the bar: STEWARD, an input reading "Ask the steward...", send, and NEW CHAT, which is disabled. One dim hint line above lists example commands. |
| Growing | A transcript above the bar, anchored to the bottom, with the newest message in view. It grows up to about 55% of the middle column, then scrolls. The tab content shrinks to make room. |

**Interactions:**

- User presses Enter or ▶ → the message sends. Shift+Enter adds a new line. A blank message is ignored.
- User clicks NEW CHAT → the transcript clears back to the empty state.

**What the steward can do:**

1. Answer questions about quests in any guild, using every MCP tool the agents use today, for example "what's blocked?".
2. Log a bounty.
   - User says "log a defect in codex: …" → a DEFECT with origin steward appears at the top of that guild's board, and the guild's count goes up.
   - The reply reads "Logged DEF in codex [open ↗]", and "open ↗" opens bounty mode on it.
   - With no guild named, the steward uses the selected guild. With ALL GUILDS selected, it asks "Which guild?".
3. Promote a bounty.
   - User says "promote <words>" → the matching live bounty becomes a quest, added to the end of QUEUED.
   - The reply links to the new quest.
4. Change what the right column shows.
   - User says "show me the login page", "show health" or "show bounties for siegelense" → the right column focuses that.
   - The reply says what it focused.
5. Say so when nothing matches, for example "I could not find a quest matching …" or "I do not know a guild called …".

**Rules:**

- There is no scope dropdown. A request names its guild, or the steward uses the guild selected on the left.
- **Prompt rule: hand new features to ChaosWhisperer.** The steward does not spec features itself.
  - When the user describes a new feature, the steward detects it, picks the guild, and starts a new quest there.
  - The user's own words go to ChaosWhisperer as the first message, and the user lands on that quest.
  - A bug report goes the same way, to a bug hunt.
  - A thought the user wants kept but not built is logged as a bounty.

## 5. Right column: the frame and the divider

**Purpose:** a global panel the user can resize, whose width never jumps.

**Frame:**

- A full-width bar runs across the top. On the RAID list it reads "RAID". On any focused view it reads "← RAID", and clicking it returns to the list.
- A focused view shows a breadcrumb under the bar, for example "FOCUS · <quest title>", "FOCUS · HEALTH", "FOCUS · EPIC · <title>" or "FOCUS · BOUNTIES · <guild>".

**The divider:**

- It is a vertical handle with a grip. The cursor becomes col-resize, and the handle highlights gold on hover and while dragging. Its tooltip reads "Drag to resize · double-click to reset".
- User drags it → the right column's width follows. The width is held between 320px and 60% of the frame.
- User releases → the width is saved for the current mode and survives a reload.
- User double-clicks → the width resets to the mode's default: 400px in the command center, and 40% in quest and bounty mode.

**Rules:**

- **Only dragging changes the width.** Switching between the RAID list, a quest, health, an epic, bounties, a question or a ward failure never resizes the column.
- Each mode remembers its own width.

## 6. The RAID panel

**Purpose:** the live view of every quest across every guild, animated as a pixel-art party. Each quest is a lane with a creature hero, for example a raccoon wizard, a rat warrior, a frog cleric or an owl ranger. It replaces today's queue bar, and absorbs what the `/queue` page shows.

### 6.1 Panel header

- It reads "RAID · 6 need you · 4 running · 5 queued", with PAUSE or PLAY at the right end. "· paused" is added while dispatch is paused.
- User clicks PAUSE → dispatch pauses. The queued lanes dim, the QUEUED drawer says "(paused)", and the health strip and header chip update.
- User clicks PLAY → dispatch resumes, and everything reverts.
- The counts stay visible whichever drawers are collapsed.

### 6.2 Drawers

There are three drawers, most urgent first.

| Drawer | Holds | Scene |
|---|---|---|
| NEEDS ATTENTION (N) | Quests waiting on the user | one scene per kind (6.4) |
| ACTIVE (N) | Running quests in a work role: codeweaver, spiritmender, ward, siegemaster, flowrider | **Battle** (6.5) |
| QUEUED · dispatch order (N) | Queued quests, numbered in dispatch order | **Travel** (6.6) |

- User clicks a drawer header (▾ or ▸) → that drawer alone collapses or expands. The choice survives a reload.
- An empty NEEDS ATTENTION drawer reads "Nothing is waiting on you."
- The lanes scroll inside the panel when they do not fit.

### 6.3 Every lane

- User clicks a lane → the right column focuses that item (section 7).
- User clicks ↗ at the lane's end → quest mode opens for that quest.
- The quest that is open, or was opened last, has a highlighted lane. Coming back from quest mode, the user sees which lane they were in.
- Every lane carries the token line (section 10). A locked lane is the exception.
- A lane in an epic carries a marker such as "⛓ Command Center 2/3". User clicks the marker → the right column focuses the epic.
- Lanes have fixed heights, and each clips its own sprites, so nothing spills into a neighbour.

### 6.4 NEEDS ATTENTION lanes

Each lane shows its kind tag, the title, the guild, the age, and a one-line note where there is one, for example the question's text or "lint: 2 errors in packages/ward".

| Kind | Means | Scene | Resolve animation |
|---|---|---|---|
| APPROVE (gold) | A quest waiting at review_flows or review_observables | The hero holds up a scroll beside a sealed gate, with a pulsing "!" | The gate opens and the hero hops |
| QUESTION (magenta) | An agent waiting on a clarifying question | The hero taps a foot beside a "?" bubble | The bubble pops and the hero hops |
| BLOCKED (red) | A blocked quest | The hero shoves a boulder that will not move | none |
| WARD FAIL (amber) | A failed ward run | The hero lies knocked down with stars circling, and the monster stands over it | The hero gets up and the monster fades |

### 6.5 ACTIVE lanes: battle

- The first running quest gets a large featured lane. The others get compact lanes.
- A lane shows the title, the role, the elapsed time ticking every second, "items 5/9", and the token line.
- The hero fights a monster. A ward run fights a lint goblin. The animation includes an idle bob, a lunge, a projectile, a hit flash and a floating damage number.
- **The monster's HP tracks the remaining work items:** HP = 1 − done / total. 5 of 9 items done shows 44% HP.
- When a work item completes, the monster dies with a "+XP" pop and respawns at its new HP.

### 6.6 QUEUED lanes: travel

- A queued lane shows its number, the title, the token line, and a hero walking over a scrolling ground strip.
- **Locked lane:** an epic step whose earlier step is not complete. It shows a padlock instead of a hero, a dim title, and "waits on #N".

### 6.7 Motion

- Under `prefers-reduced-motion`, every scene freezes on a still frame and the slide-overs stop sliding. That covers the pulsing dots in the chats too, which the prototype does not yet.

## 7. Focused views

**Purpose:** act on one thing without leaving the command center. A focused view replaces the RAID list in the right column, or fills the slide-over.

**Rule:** every view about a quest **leads with that quest's scene, large and full width**, with the details and actions under it.

### 7.1 Quest

- **Scene:** the waiting scene if the user came from a NEEDS ATTENTION lane. Otherwise the battle if it is running, or the travel scene if it is queued ("queued · position N — travelling to the front of the line"). No scene if it is finished.
- **Header:**
  - The title.
  - The guild, status, role and elapsed time.
  - An epic line, "⛓ EPIC · <title> 2/3", which the user can click to open the epic.
- **TOKENS block** (section 10).
- **Work items:** the ledger. Each item is done (✓), in progress (▶) or pending (○).
- **Log:** the last few log lines.

| User does | Then |
|---|---|
| Clicks APPROVE, which shows only at review_flows or review_observables | The resolve animation plays, the status becomes approved, the lane leaves NEEDS ATTENTION and joins QUEUED, and the counts update |
| Clicks OPEN QUEST ↗ | Quest mode opens |
| Clicks PAUSE or RESUME, which is disabled for finished quests | The quest pauses or resumes |

### 7.2 Question

- It shows the question and one button per option.
- User clicks an option → the bubble pops, the lane leaves NEEDS ATTENTION, and the answer reaches the agent.

### 7.3 Ward failure

- It shows each failing file, with its line and column, and the rule broken.
- User clicks RETRY WARD → the hero gets up, the lane leaves NEEDS ATTENTION, and ward runs again.

### 7.4 Blocked

- It shows the quest's details and the boulder scene. It has no resolve action of its own.

### 7.5 A guild's bounties

- The user reaches it by asking the steward, for example "show bounties for siegelense".
- It is a compact bounty board for that guild, with the kind chips.
- User clicks a row → bounty mode opens.

### 7.6 Health

| Section | Shows |
|---|---|
| Orchestrator | Dispatch state, slots in use out of the total, event-loop lag, uptime |
| Claude | Up or degraded; latency p50 and p95; tokens per second; requests in flight; error rate over the last hour; the 5-hour and weekly rate-limit cards with their reset times |
| Local models (later) | One card per backend, for example "ollama · qwen2.5-coder:32b", with the same figures plus GPU memory use |
| Role routing (later for local models) | Which role runs on which backend, with requests per role over the last hour |
| Server errors (later) | The count over the last hour, the last error line, and a link to the defects they created |

**Rules:** the error rate turns red at 5%. GPU memory turns amber at 90%.

### 7.7 Epic

- The header reads "⛓ EPIC · <title>", then the guild, "1/3 done", the total tokens and the estimated cost.
- The steps form a vertical numbered chain joined by a connector. Each step shows its title, status, items and tokens. A locked step shows "waits on #N".
- User clicks a step → that quest is focused.
- User clicks REORDER → drag handles appear on the steps, and DONE ends reordering.

## 8. Slide-overs

**Purpose:** see the RAID list or health from inside a detail view without leaving it.

**States:**

- It is a drawer pinned to the right edge of the frame, at the RAID panel's width, with a gold edge and a shadow.
- Its top row reads "slide-over · Esc or click outside to close", with an ✕.
- Under that, it holds the same RAID panel or health view as the right column.

**Interactions:**

- User clicks the header chip in a detail view → the RAID list slides in.
- User clicks the health strip in a detail view → the health view slides in.
- User clicks ✕, presses Esc, or clicks outside → it slides out.
- User clicks a lane inside → that lane's focused view shows inside the slide-over, with its own "← RAID".
- User clicks ↗ or OPEN QUEST inside → the slide-over closes and quest mode opens.
- User clicks a bounty inside → the slide-over closes and bounty mode opens.

**Rules:**

- The view underneath never moves or changes.
- Acting inside the slide-over updates the header chip's counts at once.
- The slide takes about 180ms, and none under reduced motion.

## 9. Quest mode

**Purpose:** work in one quest's chat without leaving the command center. It replaces today's separate quest page.

**Opening and leaving:**

- Opened by: a quest row, a lane's ↗, OPEN QUEST ↗, or a promoted bounty's quest link.
- Left by: "← COMMAND CENTER", Esc, or clicking a guild or ALL SESSIONS.

**Layout:**

- The header stays, with the header chip showing.
- The left column starts as the rail.
- The middle holds the chat.
- The right holds the spec panel, by default 40% of the width. The user can drag it wider or narrower, and switching SPEC and DETAILS does not change it.
- The giant logo and the big raccoon above the transcript are gone. The raccoon lives in the RAID panel.

**Transcript header:** "← COMMAND CENTER", the context meter in the token format (section 10), and a "show details" toggle.

**The transcript is toned down by default.**

| Today ("show details" on) | Command center (default) |
|---|---|
| A full-width context line between every turn, and "+N context" under every message | One small dim token figure on each message's label line, with the full detail on hover |
| Heavy borders on both sides of every message, and the model name on every label | A thin dim rule on the left only. The model name shows on hover. User messages get a light tint. |
| One full-width row per tool call | A run of tool calls folds into one dim line, for example "▸ 4 tools · Read ×2, get-project-map, Agent". A failure adds a red "· 1 failed". |
| Sub-agent chains expanded | Collapsed to one line with the sub-agent's purpose, duration and result |

| User does | Then |
|---|---|
| Clicks a folded tool line | It expands to today's tool rows. A failed call shows red, with its error. |
| Clicks a sub-agent line | It expands to its own tool calls |
| Toggles "show details" | Today's look and the toned-down look swap, on the same transcript |
| Picks a clarify option | The buttons are replaced with "answered: <option>" |
| Sends from the composer ("Reply to chaoswhisperer...") with Enter | The message joins the transcript. Shift+Enter adds a new line. |

**Always prominent, in both looks:**

- the agent's own writing;
- the clarify box: a bordered "CHAOSWHISPERER ASKS" with the question and option buttons;
- errors;
- the streaming indicator ("chaoswhisperer is writing…").

**Spec panel:**

- The title, and ABANDON QUEST. ABANDON QUEST swaps in place for CONFIRM ABANDON and CANCEL, with no modal.
- The SPEC and DETAILS tabs.
- SPEC shows the status, the user request and the flows.
- DETAILS shows design decisions, operations and tooling.

## 10. Token figures

**Purpose:** show how many tokens a quest uses everywhere a quest appears, in one format.

| Where | Shows |
|---|---|
| Raid lanes and QUESTS rows | "ctx 142k/1M ▬ · Σ 3.4M": the highest context among the quest's live sessions out of the limit, a small bar, then the quest's total tokens so far |
| Quest-mode transcript header | The same context figure and bar |
| A focused quest's TOKENS block | Context now out of the limit for each active session, by role, with a percentage; total tokens in, out and Σ; an estimated cost; a bar per role (chaoswhisperer, codeweaver, ward, spiritmender, siegemaster and so on) |
| An epic | The total across its quests, and an estimated cost |

**Rules:**

- The context bar and its figure turn amber above 70% and red above 90%.
- "ctx —" means no live session, and "Σ 0" means nothing spent yet.
- Totals read as "720k" below a million and "3.4M" above.
- Hovering shows the exact figures.

## 11. Epics

**Purpose:** quests linked in execution order. A quest in an epic starts only once every earlier quest in the chain is complete. **How epics display is a first take, and still open.**

| Where | Shows |
|---|---|
| QUESTS tab | A collapsible group row: an EPIC tag, the title, and "1/3 done · Σ 2.7M". Expanded, the steps are listed in order, numbered, and joined by a connector. A step that cannot start yet shows a lock and "waits on #N". |
| RAID lanes | A marker such as "⛓ Command Center 2/3". A queued step that cannot start shows a padlock instead of a walking hero. |
| Epic view | The full chain, with tokens, cost and REORDER (section 7.7) |

**Rule:** a step is locked while any earlier step is not complete.

## 12. Keyboard

| Key | Where | Effect |
|---|---|---|
| Esc | A slide-over is open | Closes the slide-over only |
| Esc | Quest mode or bounty mode | Returns to the command center |
| Enter | The steward, quest and Sparkwright composers | Sends |
| Shift+Enter | The same composers | New line |

Keyboard focus order and accessibility are not designed yet. The prototype's clickable areas cannot be reached by keyboard.

## 13. Bounty mode

**Purpose:** read, edit and talk through one bounty, then promote it or abandon it.

**Opening and leaving:**

- Opened by: a bounty row, a row in a guild's bounties view, or the steward's "[open ↗]" link.
- Left by: "← COMMAND CENTER", Esc, or clicking a guild or ALL SESSIONS.

**Layout:**

- The left column starts as the rail.
- The middle holds the Sparkwright chat.
- The right holds the document panel, by default 40% of the width, with its own remembered width.

### 13.1 Sparkwright chat

- Its header reads "← COMMAND CENTER", then "sparkwright · <kind> · <guild>", then the same "show details" toggle as quest mode.
- When empty it reads "Sparkwright reads this document first. Ask it to flesh out, format, or add to it."
- The composer reads "Describe your idea...".
- The chat belongs to that bounty.

### 13.2 Document panel

**Header band:**

- The kind tag, and the title, which is the document's first line.
- The guild, origin, age, the occurrence count for merged defects, and the state.
- EDIT and ABANDON at the top right. ABANDON shows only while the bounty is live.

**Reading:**

- The document shows rendered, as one markdown section. There are no RAW and PREVIEW tabs.
- It renders headings, paragraphs, bold, italic, inline code, lists, tables, code blocks, and screenshots placed between paragraphs with captions.
- The panel scrolls, and its footer stays put.

**Editing:**

| User does | Then |
|---|---|
| Clicks EDIT | The section becomes a markdown editor holding the raw text, with images visible as `![caption](path)`. The buttons become SAVE and CANCEL. PROMOTE is disabled. |
| Clicks CANCEL | Every edit since EDIT is undone, and the rendered view returns |
| Clicks SAVE with nothing changed | The rendered view returns, and nothing else happens |
| Clicks SAVE with changes | The rendered view returns with the new text. **The edits go to Sparkwright:** the chat gets an entry such as "Edited the document — 2 lines changed: ## Proposal", Sparkwright replies, and "● Sparkwright is updating…" shows on the document while EDIT is disabled. Any follow-up change Sparkwright makes appears in the document, with a short confirmation banner. |

**Footer:**

| State | Footer | User clicks |
|---|---|---|
| Live idea or follow-up | PROMOTE TO QUEST | A ChaosWhisperer quest is created in the same guild and added to the end of QUEUED. The bounty becomes promoted. |
| Live defect | PROMOTE TO BUG HUNT | A bug-hunt quest is created, and the rest is the same |
| Promoted | "Promoted → <quest> ↗" | Quest mode opens for that quest |
| Abandoned | "Abandoned — nothing to promote." | none |

**Abandon:** user clicks ABANDON → it swaps in place for CONFIRM ABANDON and CANCEL, with no modal. User clicks CONFIRM ABANDON → the bounty becomes abandoned and its board row dims, with the title struck through.

**Rules:**

- A promoted bounty cannot be promoted again or abandoned.
- The idea quest e87996cb specifies RAW and PREVIEW tabs and an autosaving editor. The command center replaces both: the document reads rendered, edits happen behind EDIT, and SAVE hands them to Sparkwright.

## 14. Screen sizes

| | 1600 wide | 1280 wide (under 1400) |
|---|---|---|
| Header chip | Full text | Abbreviated |
| Health strip | Model names shown | Model dots only |
| QUESTS rows | Figures on one line | Figures on a second line |
| RAID panel | More lanes fit before scrolling | The lower queued lanes need the panel's own scroll |
| Everywhere | The header stays on one row. Lane heights are fixed. Column widths change only by dragging. Left-column buttons never move. | same |

## Later

| Feature | What it needs |
|---|---|
| Tavernkeeper follow-ups | After reviewing a feature, a tavernkeeper writes follow-up bounties with origin tavern |
| Defects from server errors | A server error creates a defect with origin srv-err. Repeats of the same error merge into one row with a count, for example ×14. |
| Local-model health and role routing | The orchestrator calling local backends at all, then the health cards and the routing table |
| Design mocks during a spec | ChaosWhisperer, or a design role, shows mocks while a quest is being specced |

## Prototype shortcuts — not requirements

- Every number is seeded: tokens, costs, slots, rate limits, latencies, ages and errors. Ages never grow.
- The steward is a pattern matcher with canned replies. It has no model and does no streaming.
- Every quest opens the same sample transcript, with its own title swapped in. Sending a message gets no reply.
- Sparkwright's replies, and its follow-up edit, are canned.
- The monster dies on an 8-second timer, not when a work item completes.
- Approving queues a quest but never starts it. Answering or retrying clears the need but changes nothing else. CONFIRM ABANDON on a quest does nothing.
- PROMOTE TO BUG HUNT creates an ordinary quest.
- REORDER on an epic is cosmetic, and only one sample epic exists.
- Most state resets on reload: selections, the steward transcript, every approval, promotion and edit. Only the column widths, the drawers and the DEVOUR choice persist.
- "Show later features" is a prototype-only toggle. It hides tavern and srv-err bounties, server errors in the header and the health view, and local-model rows in role routing.
- The seeded queue holds a quest that is already complete.
- The + buttons do nothing.

## Open questions

1. How should the work be cut into quests? Draft cut:
   - A: the bounty record, the BOUNTY BOARD tab and bounty mode, by widening e87996cb.
   - B: the layout, the RAID panel, focused views, health, slide-overs, the divider and the DEVOUR toggle.
   - C: the steward, after A and B.
   - D: quest mode and the toned-down transcript, which could ride with B.
   - E: epics.
   - F: token figures, which several of the others read from.
2. Does a "new feature" the steward detects start the quest at once, or ask "start a quest in codex?" first?
3. Should `scrolls/bounty-board/` be imported into the app board once, or kept as this repo's separate hand-kept list?
4. Does a raid hero's creature follow the role, the guild, or the quest?
5. Does the `/queue` page survive once the RAID panel shows the same thing?
6. How should epics display, and who creates one: the user, the steward, or ChaosWhisperer when a spec is too big for one quest? Can a quest belong to more than one epic, and can an epic span guilds?
7. The health strip switches the right column when the RAID list is showing, but slides over everywhere else. Should it always slide over, so there is one rule?
8. Does the steward's transcript persist across reloads and visits, or start fresh each time?
9. What does a SESSIONS row do when clicked, and what does + create on that tab?
10. Should Esc also cancel a bounty edit, and also return a focused view to the RAID list?
