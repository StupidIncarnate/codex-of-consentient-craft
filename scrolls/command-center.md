# Command Center: the root page redesign

This is the feature list for the redesigned root page (`/`). It is a planning doc, not a quest. Quests get cut from it later.

The clickable prototype is the "Command Center" page in the design app. Run `cd scrolls/design && npx vite` and open
http://localhost:4000. The page code is `scrolls/design/pages/command-center.jsx`. Mock data only.

## The layout rule

**The left side is filtered by the selected guild. The right side is global, whatever guild is selected.**

| Region                       | Scope            | What it holds                                                                                                         |
|------------------------------|------------------|-----------------------------------------------------------------------------------------------------------------------|
| Header                       | global           | Logo, the health strip, the live chip when the RAID list is hidden, the "show later features" toggle (prototype only) |
| Left column                  | picks the filter | The ALL GUILDS icon button, the guild list with per-guild counts, and an ALL SESSIONS button at the bottom            |
| Middle column                | selected guild   | The QUESTS, BOUNTY BOARD and SESSIONS tabs, with the steward chat at the bottom                                       |
| Right column: the RAID panel | global           | Every quest that needs the user, is running or is queued, as animated lanes. Clicking a lane focuses it.              |

A drag handle sits between the middle and the right column (feature 9).

The page has three modes. The command center is the default. Quest mode (feature 10) and bounty mode (feature 11)
open one quest or one bounty. "← COMMAND CENTER" or Esc returns from either.

## Features

### 1. The header chip

- When the RAID list is hidden, a header chip reads "⚔ 6 need you · 3 running · 4 queued", with a small PLAY / PAUSE. It shows in quest mode, in bounty mode, and while the RAID panel shows a focused item.
- When the RAID list is visible, the chip is hidden, so it never repeats the panel.
- **In a detail view, clicking the chip slides the RAID list in from the right
  edge**, as an overlay at RAID's width. The detail view stays where it is. This applies in quest mode, in bounty mode, and in a focused raid view. Clicking the health strip slides the health view in the same way.
- Close the slide-over with ✕, Esc, or a click outside. Clicking a lane inside it opens that lane's focus inside the slide-over.
- The slide takes about 180ms, and none under reduced motion.
- On narrow screens the chip and the health strip abbreviate, so the header stays on one row.

### 2. Guild column

- ALL GUILDS is an icon button with a guild icon, and a divider sits under it. The guilds follow.
- Every guild has an icon square, its initials, in both the full column and the rail. In the full column its name and counts sit beside the square, for example "4 active · 5 bounties".
- The column shrinks to a rail in quest mode and bounty mode. **No button moves when it
  does.** Every button keeps the same vertical position.
- At the bottom of the column sit two buttons: ALL SESSIONS, and under it ≡. In the rail both are icons.
- **In the rail, ≡ expands the full guild column as an
  overlay** without leaving the detail view. ≡ or Esc collapses it again.

### 3. Middle column tabs

- **QUESTS:** the selected guild's quests. Clicking a row opens quest mode. A row has the bounty board's layout:
    1. the status in a tag box on the left, in the status colour;
    2. the guild and the title;
    3. right-aligned progress figures, with no animation: the current role, "items 5/9" with a small bar, the elapsed time, and the token figures (feature 12).

    - A finished quest shows its final totals. An abandoned row is dimmed and struck through.
    - An epic shows as a collapsible group (feature 13).
- **BOUNTY BOARD:** every item that comes before a quest. See feature 4. Clicking a row opens bounty mode.
- **SESSIONS:** the selected guild's sessions.
- A + on the tab bar creates whatever the active tab lists.
- A short list ends in a quiet hint line, for example "+ add an idea, or tell the steward".

### 4. Bounty board: one record for everything before a quest

Ideas, defects and follow-ups are all starter information captured before a quest exists. They are one record type with two fields, so every source writes into the same list.

| Field  | Values                                                                                    |
|--------|-------------------------------------------------------------------------------------------|
| kind   | `idea`, `defect`, `follow-up`                                                             |
| origin | `you`, `steward`, `tavern` (a tavernkeeper), `srv-err` (a captured server error)          |
| state  | live, promoted (links to its quest), abandoned (struck through and dimmed, never deleted) |

- Kind filter chips sit above the list.
- A record's content is one markdown document, with screenshots inside it. Bounty mode (feature 11) is where it is read and edited.
- PROMOTE TO QUEST starts a ChaosWhisperer spec for an idea or a follow-up. On a defect the button reads PROMOTE TO BUG HUNT, and it starts a bug hunt.
- ABANDON swaps in place for CONFIRM ABANDON and CANCEL, exactly like ABANDON QUEST does today.
- **The idea quest `e87996cb-b86e-4bec-97bc-3e6f0b299542` gets widened to this record before it
  starts.** Today it specifies ideas only, with an IDEAS tab.
- The hand-kept markdown board in `scrolls/bounty-board/` is this repo's own board. It stays as it is until the app board exists. Whether to import it once is still open.

### 5. The RAID panel

The whole right column is one list of lanes. A lane is one quest, animated as a creature hero, for example a raccoon wizard, a rat warrior, a frog cleric or an owl ranger. The lanes stack in three sections, most urgent first.

| Section         | What is in it                                                                          | Animation                                                                                                                                                                                     |
|-----------------|----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NEEDS ATTENTION | Quests waiting on the user, across every guild                                         | One scene per kind, below                                                                                                                                                                     |
| ACTIVE          | Running quests, in a work role: codeweaver, spiritmender, ward, siegemaster, flowrider | **Battle.** The hero fights a monster. The monster's HP tracks the quest's remaining work items. A ward run fights a lint goblin. A monster dies, with a +XP pop, when a work item completes. |
| QUEUED          | Queued quests, numbered in dispatch order                                              | **Travel.** The hero walks across a scrolling landscape.                                                                                                                                      |

The NEEDS ATTENTION scenes:

| Kind                                                           | Scene                                                                          |
|----------------------------------------------------------------|--------------------------------------------------------------------------------|
| APPROVE: a quest waiting at review_flows or review_observables | The hero holds up a scroll beside a sealed gate, under a pulsing "!"           |
| QUESTION: an agent waiting on a clarifying question            | The hero taps a foot beside a "?" speech bubble                                |
| BLOCKED: a blocked quest                                       | The hero shoves a boulder that will not move                                   |
| WARD FAIL: a failed ward run                                   | The hero lies knocked down with stars circling, and the monster stands over it |

- The panel header reads "RAID · 6 need you · 3 running · 4 queued", with the dispatch PLAY / PAUSE toggle at its right end.
- **Each section is a
  drawer.** NEEDS ATTENTION, ACTIVE and QUEUED each have a header with ▾ or ▸ and their count, and each collapses on its own. The collapsed state survives a reload. The panel header's counts stay visible either way.
- Each lane shows its kind tag where it has one, the guild, the title and the age. A running lane also shows the current role, the elapsed time, and the progress labelled as items, for example "items 5/9".
- Every lane carries the token line (feature 12).
- A lane in an epic carries an epic marker, and a queued quest waiting on its epic shows a lock instead of a walking hero (feature 13).
- The list scrolls inside the panel. Each lane clips its own sprites, so no sprite spills into a neighbour.
- Under `prefers-reduced-motion` every scene freezes to a still frame.
- RAID replaces today's queue bar, and absorbs what the `/queue` page shows.

### 6. Focusing a raid lane

Clicking a lane replaces the list with that lane's focused view. A "← RAID" bar across the top returns to the list, and a "FOCUS · <thing>" breadcrumb sits under it.

- **The view leads with the lane's scene, large and full width.** The details and actions sit below it.
- Acting plays a short resolve animation before the lane moves on. The gate opens, the bubble pops, or the hero gets up. Then the lane moves to ACTIVE or QUEUED. An approved quest joins QUEUED.
- The panel keeps its width. Switching what it shows never resizes it.

| Focused on         | Shows                                                                                                            | Actions                                                                  |
|--------------------|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| A quest            | Guild, status, current role, elapsed time, the TOKENS block (feature 12), the work-item ledger, recent log lines | OPEN QUEST ↗, PAUSE / RESUME, and APPROVE when it is waiting on approval |
| An epic            | The epic's chain of quests (feature 13)                                                                          | REORDER                                                                  |
| A pending question | The question and its options                                                                                     | One button per option                                                    |
| A failed ward run  | The failing files and rules                                                                                      | RETRY WARD                                                               |
| A guild's bounties | That guild's board, with the chosen row highlighted                                                              | PROMOTE TO QUEST, ABANDON                                                |
| Health             | See feature 7                                                                                                    | none                                                                     |

### 7. Health

- A compact strip sits in the header. Clicking it switches the RAID panel to the full health view. It never expands inline.
- **Orchestrator:** dispatch state, slots in use out of the total, event-loop lag, uptime.
-
**Claude:** the 5-hour and weekly rate-limit windows, the percentage used, the reset time, latency p50 and p95, tokens per second, requests in flight, and the error rate over the last hour.
- **Local
  models** (later): one row per backend the orchestrator can call, for example ollama or llama.cpp. Each row shows the same figures as Claude, plus up, down or degraded, plus GPU memory use.
- **Role
  routing** (later for local models): which role runs on which backend, with requests per role over the last hour. Without it, a latency figure cannot be tied to the work that caused it.
- **Server errors** (later): the count over the last hour and the last error line, linked to the defects they created.

### 8. The steward chat

The steward is the project-manager agent. It talks about quests in every guild and acts on them.

- It sits at the bottom of the middle column. It starts as just the input box and grows upward as the conversation builds, up to about half the column, then scrolls.
- A NEW CHAT button clears it back to the input box.
- It has no scope dropdown. A request names its guild, or the steward uses the guild selected on the left. With ALL GUILDS selected and no guild named, it asks which guild.
- When the transcript is empty, one dim hint line lists what it can do.
- The same steward opens from inside a guild, already pointed at that guild.

**What it can do**

1. Use every MCP tool the agents use today: read quests and their state across guilds, and act on them.
2. Log bounties: "log a defect in codex: …" or "add an idea for siegelense: …" creates the record, with origin
   `steward`. The reply links to it, and the link opens bounty mode.
3. Promote a bounty to a quest, the same as pressing PROMOTE TO QUEST.
4. Change what the RAID panel shows: "show me the login page", "show health", "show bounties for siegelense". Its reply says what it focused.

**Prompt rule: hand new features to
ChaosWhisperer.** The steward does not spec features itself. When the user is describing a new feature, the steward detects that, picks the guild, and starts a new quest in it. The user's own words go to ChaosWhisperer as the quest's first message, and the user lands on that quest. A bug report goes the same way to a bug hunt. A passing thought the user wants kept, not built, is logged as a bounty.

### 9. The resizable divider

- A vertical drag handle sits between the middle column and the right column. It shows a grip, a col-resize cursor, and a highlight on hover and while dragging.
- Dragging sets the right column's width, between 320px and 60% of the frame.
- The width is stored per mode, so the command center, quest mode and bounty mode each remember their own. It survives a reload.
- Double-clicking the handle resets the width to the mode's default.
- Dragging is the only thing that changes the width.

### 10. Quest mode: a quest's chat inside the command center

Opening a quest keeps the user in the command center rather than leaving for a separate page.

- Click a quest row, a raid lane's ↗, or OPEN QUEST ↗ in a focused quest to open it.
- The header and the health strip stay, and the header chip shows the raid counts. The chip replaces today's quest queue bar.
- The guild column shrinks to its rail.
- The quest's chat transcript and composer fill the middle.
- The quest's spec panel fills the right, by default 40% of the width. It holds the title, ABANDON QUEST, the SPEC and DETAILS tabs, the status, the user request, and the flows.
- The giant logo and the big raccoon above the transcript are gone. The raccoon lives in the RAID panel.
- Returning to the command center highlights that quest's raid lane.

**The transcript is toned down by default.**

| Today                                                                               | Command center                                                                                                                                         |
|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| A full-width context line between every turn, and "+N context" under every message  | One small dim token figure on each message's label line, with the detail on hover                                                                      |
| Heavy 2px borders on both sides of every message, and the model name on every label | A thin dim rule on the left only. The model name shows on hover. User messages get a light tint.                                                       |
| One full-width row per tool call                                                    | A run of tool calls folds into one dim line, for example "▸ 4 tools · Read ×2, get-project-map, Agent". It expands on click. Only failures get colour. |
| Sub-agent chains shown expanded                                                     | Collapsed to one line with their duration                                                                                                              |

The agent's own writing, clarify questions, errors and the streaming indicator keep their emphasis. A "show details"
toggle brings back today's look for the same transcript.

### 11. Bounty mode: one bounty's detail view

Clicking a bounty board row, or a steward's "[open ↗]" link, opens the bounty. It is laid out like quest mode.

- The guild column shrinks to its rail.
- **Right: the document panel.**
    1. A header band shows the kind tag (IDEA, DEFECT or FOLLOW-UP), the title, the origin, the age and the state. EDIT and ABANDON sit at its top right.
    2. Under it is one markdown section, rendered: headings, lists, tables, code blocks, inline code, and screenshots placed between the paragraphs, with captions. There are no RAW and PREVIEW tabs.
    3. **EDIT turns the section into a markdown
       editor** holding the raw text, with each image visible as `![caption](path)`. The buttons become SAVE and CANCEL.
    4. **CANCEL undoes every edit** made since EDIT was clicked, and returns to the rendered view.
    5. **SAVE sends the edits to
       Sparkwright.** The section returns to the rendered view with the new text. The chat gets a user entry summarising the edits, for example "Edited the document — 2 lines changed: ## Proposal (tightened)". Sparkwright replies, and any follow-up change it makes appears in the document.
    6. A footer holds PROMOTE TO QUEST, or PROMOTE TO BUG HUNT on a defect. A promoted bounty shows
       "Promoted → <quest> ↗" instead.
- **Middle: the Sparkwright chat for that
  bounty.** It uses the same toned-down transcript as quest mode, with the placeholder "Describe your idea...". When empty it shows the hint "Sparkwright reads this document first. Ask it to flesh out, format, or add to it."
- The idea quest e87996cb specifies this page as chat on the left and the document on the right, with RAW and PREVIEW tabs and an autosaving editor. The command center keeps the layout but replaces the tabs and the autosave: the document reads rendered, edits happen behind EDIT, and SAVE hands them to Sparkwright.

### 12. Token figures

Every place that shows a quest shows how many tokens it uses, in one shared format.

| Where                      | What it shows                                                                                                                                                                                                |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Raid lanes and QUESTS rows | One dim line: the current session's context, for example "ctx 142k/1M" with a small bar, then the quest's total so far, for example "Σ 3.4M". The bar turns amber above 70% and red above 90%.               |
| A focused quest            | A TOKENS block: context now out of the limit for each active session, total tokens in and out, a bar per role (chaoswhisperer, codeweaver, ward, spiritmender, siegemaster and so on), and an estimated cost |
| Quest mode                 | The transcript header's context meter, in the same format                                                                                                                                                    |
| An epic                    | The total across all its quests, and an estimated cost                                                                                                                                                       |

### 13. Epics: quests linked in execution order

An epic is an ordered chain of quests. A quest in an epic starts only once the quest before it is complete. **How epics
display is a first take, and still open.**

- **QUESTS
  tab:** an epic is a collapsible group row with an EPIC tag box, its title, and progress such as "1/3 done · Σ 2.7M". Expanded, its quests are listed in order, numbered, joined by a thin connector line. A quest that cannot start yet shows a lock and "waits on #2".
-
**RAID:** a lane in an epic carries a marker such as "⛓ Command Center 2/3". A queued quest waiting on its predecessor shows a lock instead of a walking hero.
- **Epic
  view:** clicking the group row or a marker focuses the epic in the RAID panel. It shows the chain as numbered steps with connectors, each step's status and progress, the total tokens and estimated cost, and a REORDER toggle that shows drag handles on the steps.

## Later

| Feature                             | What it needs                                                                                                                      |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Tavernkeeper follow-ups             | After reviewing a feature, a tavernkeeper writes follow-up bounties with origin `tavern`                                           |
| Defects from server errors          | A server error creates a defect with origin `srv-err`. Repeats of the same error merge into one row with a count, for example ×14. |
| Local-model health and role routing | The orchestrator calling local backends at all, then the health rows and routing table above                                       |
| Design mocks during a spec          | ChaosWhisperer, or a design role, shows mocks while a quest is being specced                                                       |

## Open questions

1. How should the work be cut into quests? The draft cut is: A, the bounty board and bounty mode (widening e87996cb). B, the layout, the RAID panel, focusing, health and the divider. C, the steward, after A and B. Quest mode's toned-down transcript could ride with B or stand alone.
2. Does a "new feature" detected by the steward start the quest at once, or ask "start a quest in codex?" first?
3. Should `scrolls/bounty-board/` be imported into the app board once, or kept as this repo's separate hand-kept list?
4. Does a raid hero's creature follow the role, the guild, or the quest?
5. Does the `/queue` page survive once the RAID panel shows the same thing?
6. How should epics display, and who creates one: the user, the steward, or ChaosWhisperer when a spec is too big for one quest? Can a quest belong to more than one epic, and can an epic span guilds?
