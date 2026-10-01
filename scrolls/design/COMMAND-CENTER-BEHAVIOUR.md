# Command Center — behaviour inventory (working file)

Source: the prototype page `scrolls/design/pages/command-center.jsx` plus `components/{raid-scene,quest-chat,bounty-doc,tokens,pixel-btn,map-frame,logo,rate-limit-card}.jsx`, `sprites/*`, `themes.jsx`. Driven in Chromium at 1600x1000 and 1280x800. Exhaustive rather than polished. Everything marked MOCK is a prototype shortcut, not a requirement.

Conventions used below: **STATES**, **INTERACTIONS**, **DATA SHOWN**, **RULES/INVARIANTS**, **MOCK-ONLY**,
**LATER-FLAGGED**.

---

## 0. Global

**Shell (prototype chrome, not part of the
design):** a fixed top nav (`Command Center`, `App`, `Define Quest`, `Execute Quest`, `Design`) and a theme select (Ember Depths default; Catacombs, Abyssal Keep). The Command Center page is the default page. Nothing below depends on the nav.

**Look:** Ember Depths palette from `packages/web` (bg-deep `#0d0907`, bg-surface `#1a110d`, bg-raised `#2a1a14`, border `#3d2a1e`, text `#e0cfc0`, text-dim `#8a7260`, primary `#ff6b35`, success `#4ade80`, warning `#f59e0b`, danger `#ef4444`, loot-gold `#fbbf24`, loot-rare `#e879f9`). All text monospace. Buttons are the PixelBtn shapes: primary (orange fill), ghost (bg-raised fill, 1px border), danger (red fill); 2px radius; icon variant 15px font, `0 8px` padding. The main frame is the MapFrame: 2px border with unicode corner glyphs (`┌── ──┐ └── ──┘`). Selection colour: primary fill, bg-deep glyphs.

**Page skeleton (normal
mode):** header row → one MapFrame containing three columns: guild column (left), middle column, right pane. There is no live band under the header any more (RAID replaced it).

**Quest-status colour map (used everywhere a status is shown):**
| status | colour | |---|---| | created, pending, explore_flows, flows_approved, explore_observables, paused | warning (amber) | | review_flows, review_observables | loot-gold | | approved | loot-rare (magenta) | | in_progress, merging | primary (orange) | | complete, merged | success (green) | | blocked | danger (red) | | abandoned | text-dim | Status words are the status upper-cased with `_` → space (`IN PROGRESS`, `REVIEW FLOWS`, `REVIEW OBSERVABLES`, …).

**Global state that persists (localStorage):**
| key | holds | default | |---|---|---| | `cc-pane-w-normal` | right-pane width px, normal mode | absent → 400px | | `cc-pane-w-quest` | right-pane width px, quest mode | absent → 40% of the frame | | `cc-pane-w-bounty` | right-pane width px, bounty mode | absent → 40% of the frame | | `cc-raid-collapsed` | JSON `{needs?:bool, active?:bool, queued?:bool}` — which RAID drawers are collapsed | `{}` (all open) | | `cc-rail-normal` | `'1'` collapsed / `'0'` expanded for the guild column outside detail views | absent → expanded | | `cc-rail-detail` | same, for quest mode and bounty mode | absent → collapsed |

**Not persisted (resets on
reload):** selected guild (starts `codex`), selected middle tab (starts QUESTS), right-pane focus (starts RAID), steward transcript, all store mutations (approvals, answers, promotions, abandons, defects logged, pauses), bounty doc edits and the Sparkwright chat, epic expand state, tool-group/sub-agent expand state, "Show later features" (starts ON), dispatch PLAY/PAUSE (starts playing), quest-chat "show details".

**Reduced
motion (`prefers-reduced-motion: reduce`):** every CSS animation inside `.raid-scene` is disabled (frozen on first frame) and its transitions are disabled; the monster death timer is not started; the slide-over slides with no transition. NOT covered: the blinking cursor and "writing…" dot in quest chat and the "Sparkwright is updating…" dot (they use the global `pulse` keyframes from `index.html`).

**Narrow variant (`window.innerWidth < 1400`, evaluated live on
resize):** header chip text shortens; health strip hides local-model names; QUESTS rows move their stats to a second line (details in the sections).

**Esc (
global):** if a slide-over is open → closes it; else if in quest mode or bounty mode → leaves it (back to the normal layout). Esc does nothing in normal mode, does not cancel a bounty EDIT, does not leave a focused right-pane view.

---

## 1. Header

Row: logo (left) · right group `[header chip?] [health strip] [Show later features]`. Single line at both widths (the narrow abbreviations exist to keep it one line at 1280).

### 1.1 Logo

- **STATES:** one state. ASCII-block `DUNGEONMASTER` in primary colour at 3px font, line-height 1.15, with a fireball pixel sprite (scale 2) on each side (right one mirrored), 14px gap. Half the height of the real app's logo by request.
- **INTERACTIONS:** none (not a link in the mock).
- **MOCK-ONLY:** the sprite and ASCII art are copied from `packages/web` LogoWidget; the sprite-hiding media queries of the real logo are not reproduced.

### 1.2 Health strip

- **STATES:**
    - Normal: bordered button, cells separated by `│`:
        - `● dispatch 3/4` (dot green when playing; text `dispatch`) or `● paused 3/4` (dot amber) — the `3/4` is slots in use / total.
        - `claude ▰▰▰▰▰▱▱▱ 62%` — bar + percent in warning colour (62% is in the 50–79 band).
        - Local models: `● ollama ● llama.cpp` (first dot green = up, second amber = degraded). At < 1400px only the two dots (`● ●`).
        - `⚠ 23 err/1h` in danger colour. **Hidden when Show later features is OFF.**
    - Active (border turns loot-gold) when the HEALTH view is showing in the right pane or in a slide-over.
- **INTERACTIONS:**
    - In the normal layout with the right pane on RAID → click switches the right pane to HEALTH view (pane breadcrumb `FOCUS · HEALTH`, bar becomes `← RAID`).
    - In quest mode, bounty mode, or when the right pane is already focused on something other than RAID → click slides the HEALTH view in as an overlay drawer (see §7). Detail view underneath stays.
    - Title attribute: none on the strip itself except where noted.
- **DATA
  SHOWN:** dispatch state + slots `used/total`; Claude 5h window % (bar is 8 cells: `▰` filled, `▱` empty; fill = `floor((pct*8+50)/100)`); model backend names + up/degraded state; server errors in last hour count.
- **RULES:** the rate-limit bar colours follow the real thresholds: ≥80% danger, ≥50% warning, else text-dim. Only the 5h window shows in the strip (7d is in the HEALTH view).
- **MOCK-ONLY:** all numbers are constants (3/4 slots, 62%, 23 errors). The dispatch word follows the PLAY/PAUSE toggle but nothing else reacts to it.
- **LATER-FLAGGED:** the `⚠ N err/1h` cell.

### 1.3 Header chip ("⚔ … running … queued")

- **STATES:**
    - Hidden whenever the RAID list is visible, i.e. only in normal layout with the right pane on RAID. (Rule: show chip iff quest mode OR bounty mode OR right pane focus ≠ RAID.)
    - Visible: bordered pill `⚔ 6 need you · 4 running · 5 queued` + a tiny `PAUSE` (or `PLAY`) button. `N need you` is red when N>0, dim at 0. At < 1400px: `⚔ 6 need · 4 run · 5 q`.
- **INTERACTIONS:**
    - Click the text → RAID slide-over opens (§7) over the right side. Never navigates away from the current view.
    - Click `PAUSE`/`PLAY` → toggles the dispatch state (same state as the RAID header button and the health strip's `dispatch`/`paused` word). Does not open the slide-over.
    - Hover title: in quest mode `Open quest: <guild> / <title> — click to slide the RAID in`; in bounty mode `Open bounty: <title> — click to slide the RAID in`; otherwise `Slide the RAID in`.
- **DATA
  SHOWN:** need-you count = number of NEEDS ATTENTION items; running = number of ACTIVE lanes; queued = number of QUEUED lanes (all live from the store).
- **MOCK-ONLY:** counts change only through the mock actions (approve, answer, retry, promote).

### 1.4 "Show later features" toggle

- **STATES:** `[x] Show later features` (gold border/text, ON, default) / `[ ] Show later features` (dim, OFF).
- **INTERACTIONS:** click flips it instantly everywhere. Not persisted.
- **LATER-FLAGGED — what OFF hides:**
    1. Bounty rows whose origin is `tavernkeeper` (tag `tavern`) — i.e. all FOLLOW-UP rows — and rows whose origin is `server error` (tag `srv-err`).
    2. Those rows are also excluded from every count: guild rows' `N bounties`, the `BOUNTY BOARD (N)` tab count, ALL GUILDS totals.
    3. The health strip's `⚠ N err/1h` cell.
    4. HEALTH view: the SERVER ERRORS · 1h section and, in ROLE ROUTING, the rows whose backend is a local model (codeweaver, spiritmender, flowrider rows; chaoswhisperer, siegemaster, ward rows remain).
- **Not affected:** the FOLLOW-UP kind chip in the bounty filter still shows; the RAID panel; quests.

---

## 2. Guild column and rail

One component renders both. Structure (top to bottom, identical y in every state): header row (28px: `GUILDS` label + `+` button) → ALL GUILDS row → 1px divider → guild rows → (flex spacer) → ALL SESSIONS button → DEVOUR toggle. Icon squares are 38px; row gap 8px.

### 2.1 Expanded (full column)

- **STATES:** 190px wide (+12px padding + 1px right border). Header: `GUILDS` (dim) + ghost `+` icon button (title `Add guild`). Rows: icon square + two lines of text.
    - ALL GUILDS: castle-gate pixel glyph (gold), text `ALL GUILDS`, counts line.
    - Each guild (`codex`, `siegelense`, `acme-web`): icon square with initials (`CO`, `SI`, `AC`) and up to 4 `●` dots (primary when the guild has active quests, dim otherwise), name, counts line.
    - Counts line format: `N active · M bounties` (singular `1 bounty`), 9px; the `N active` part is primary-coloured when N>0.
    - Selected row: loot-gold text and border, bg-raised fill. Default selection `codex`.
- **DATA
  SHOWN:** active = quests whose status is not `complete` or `abandoned` (epic quests count); bounties = bounty items in state `live` (respecting Show later features). ALL GUILDS aggregates all guilds. (Seeded: ALL 11 active · 9 bounties; codex 6 · 5; siegelense 3 · 2; acme-web 2 · 2.)
- **INTERACTIONS:**
    - Click a guild row → selects it (gold highlight), re-filters the middle column (QUESTS, BOUNTY BOARD, SESSIONS) and the steward's default guild for `log a defect: …`. Title: `<name> · N active`.
    - Click ALL GUILDS → selects "all" (middle shows every guild; rows gain a `guild / ` prefix). Title `All guilds`.
    - `+` → no-op in the mock.
    - ALL SESSIONS (full-width ghost-ish button, label `ALL SESSIONS`, title `All sessions`) → selects ALL GUILDS and switches the middle to the SESSIONS tab; in a detail view it also leaves the detail view.
    - DEVOUR toggle (§2.3).
- **RULES:** the icon column and row heights never change between states; every guild button's top edge is at the same y in every mode (measured 147/202/248/294 px for ALL/codex/siegelense/acme-web at both 1600x1000 and 1280x800; All-sessions 894 / 694 and toggle 932 / 732 respectively).

### 2.2 Collapsed (rail)

- **STATES:** 48px wide. Header row shows only the `+`. ALL GUILDS = gate glyph only; guild buttons = initials + dots only; the selected guild (in a detail view: the guild of the open quest/bounty) is gold-bordered. ALL SESSIONS = a `▤` icon button (title `All sessions`). Toggle = `◀|▶`.
- **INTERACTIONS:** same as expanded; clicking a guild in detail mode selects that guild and leaves the detail view; ALL SESSIONS same as above.
- **Titles:** guild buttons `<name> · N active`; ALL `All guilds`.

### 2.3 DEVOUR toggle

- **STATES:** expanded: full-width button `▶ DEVOUR ◀` (gold text, arrows pointing at the centre), title `Collapse the guild column to the rail`. Collapsed: rail-width button `◀|▶` (arrows pointing outward), title `Expand the guild column`.
- **INTERACTIONS:** click flips collapsed/expanded **in
  place** — the column width changes and the middle column resizes (nothing overlays). Works in normal mode, quest mode, bounty mode and every right-pane focus (the toggle lives in the column, which exists in all views).
- **PERSISTENCE:** two independent preferences: `cc-rail-normal` (normal layout; default expanded) and `cc-rail-detail` (quest + bounty modes; default collapsed). A choice survives reload and applies the next time that group of views opens.
- **MOCK-ONLY:** there is no animation on width change.

---

## 3. Middle column (normal mode)

Top to bottom: `FILTERED BY <guild|ALL GUILDS>` (dim, guild in gold) → tab bar → tab content (scrolls) → steward chat. When the chat grows, the tab content shrinks.

### 3.1 Tab bar

- **STATES:** tabs `QUESTS`, `BOUNTY BOARD (N)`, `SESSIONS` (10px bold; active = primary text + 2px primary underline; inactive dim). `N` = live bounties for the current filter (respects Show later features). A ghost `+` icon button sits at the right end (title `New quest / idea / defect`).
- **INTERACTIONS:** click a tab → switches. `+` → no-op in the mock. Selection is not persisted. ALL SESSIONS in the guild column forces SESSIONS.
- **EMPTY-STATE HINTS (subtle, centred, dim, below the
  list):** QUESTS `+ start a quest, or tell the steward what you need`; BOUNTY BOARD `+ add an idea, or tell the steward`; SESSIONS `sessions appear here as agents run`.

### 3.2 QUESTS tab

- **STATES / layout per
  row:** `[status tag box] [step number?] [guild / ]title … role · items d/t bar · elapsed · ctx · Σ`.
    - Status tag: 124px box, 9px bold, border + text in the status colour (see §0).
    - Title: ellipsis, hover title = full title. `guild / ` prefix (dim) only when ALL GUILDS is selected. Epic children get `N. ` step prefix.
    - Stats (right-aligned columns, no animation): role (primary if the quest is running, `—` otherwise), `items 5/9 ▰▰▰▱▱▱` (6-cell bar), elapsed (running: the lane's elapsed rounded to minutes, e.g. `12m`; finished: a final time like `26m`, `41m`, `18m`; otherwise `—`), `ctx 142k · Σ 3.4M` (`ctx —` when there's no active session; `Σ 0` when nothing spent).
    - Abandoned: row at 45% opacity, title struck through, tag dim.
    - Narrow (< 1400px): the four stats drop to a second line, indented to the title column, left-aligned, 10px.
    - Empty guild: `No quests yet`.
- **EPIC GROUP (codex only in the
  seed):** a surface-coloured row `▾|▸  [⛓ EPIC]  Command Center … 1/3 done · Σ 2.7M` listed above the plain quests. `1/3` = complete steps / total steps; `Σ` = sum of the steps' total tokens. Expanded (default expanded): steps shown in order under a 1px gold vertical connector, each a normal quest row with its step number (`1.`, `2.`, `3.`); a step whose earlier step isn't complete shows a lock glyph + amber `waits on #2` after the title. In ALL GUILDS the group title gets a `codex / ` prefix.
- **INTERACTIONS:**
    - Click a quest row → opens QUEST MODE for it (§9).
    - Click the chevron `▾/▸` → collapses/expands the group only (does not focus). Title attr `Collapse epic` / `Expand epic`. Not persisted.
    - Click anywhere else on the epic row → right pane focuses the EPIC view (§8.8).
- **MOCK-ONLY:** items d/t come from each quest's mock ledger; roles/elapsed only exist for the four running quests.

### 3.3 BOUNTY BOARD tab

- **STATES /
  layout:** first a filter line `KIND  [IDEA] [DEFECT] [FOLLOW-UP]` + `clear` (only when any chip is on); then rows. Row = `[kind tag, 62px, centred] title [×N] … [state] origin age`.
    - Kind tag colours: IDEA gold, DEFECT red, FOLLOW-UP magenta.
    - Title: with `guild / ` prefix when ALL GUILDS. A `×14` (red, bold, title attr `repeats merge into one row`) follows the title for server-error defects that merged repeats.
    - State column: live → green `LIVE`; promoted → magenta `↗ <quest title>` (truncated to 20 chars + `…`, hover = full quest); abandoned → row at 45% opacity, title struck through, dim `ABANDONED`.
    - Origin tag (46px, dim, right-aligned): `you`, `steward`, `tavern` (tavernkeeper), `srv-err` (server error) — short so nothing wraps.
    - Age (26px, right): `2h`, `5h`, `1d`, `38m`, `0m`…
    - Highlight: the clicked row gets a bg-raised fill and 2px gold left border (local to this tab instance).
    - Empty after filtering: `Nothing on the board`.
- **INTERACTIONS:**
    - Click a kind chip → toggles it (multi-select; chips fill solid when on); no chips on = all kinds. `clear` resets.
    - Click a row → highlights it and opens BOUNTY MODE (§10).
- **DATA
  SHOWN:** kind, title, guild (ALL view), count, state + promoted quest, origin tag, age. Seeded: 14 rows across the three guilds (see §10 for which have documents).
- **LATER-FLAGGED:** rows with origin `tavern` and `srv-err`.
- **MOCK-ONLY:** ages are fixed strings; a newly logged defect shows age `0m` and never grows.

### 3.4 SESSIONS tab

- **STATES:** plain list. Row = `[guild / ]summary … [QUEST chip] [STATUS] age`. `QUEST` is a dim primary outline chip for sessions attached to a quest; status in the status colour (`IN PROGRESS`, `REVIEW FLOWS`, `COMPLETE`); age e.g. `2m`, `1h`, `1d`. Untitled session text `Untitled session`.
- **INTERACTIONS:** none (rows have a pointer cursor but no action).
- **MOCK-ONLY:** 7 seeded sessions.

---

## 4. Steward chat (bottom of the middle column)

- **STATES:**
    1. **Empty** (initial, and after NEW CHAT): no transcript, a dim hint line above the input: `try: show health · show me the login page · show bounties for siegelense · log a defect in codex: …`. Bar: `STEWARD` label (primary, bold) · input · `▶` send · `NEW CHAT` (ghost, disabled/dim while empty).
    2. **Growing:** a transcript appears above the bar (bottom-anchored, auto-scrolls to newest), separated by a top border. The chat's height is capped at 55% of the middle column; beyond that the transcript scrolls; the tab list above shrinks to make room.
- **Bubble
  styles:** `YOU` (gold label, bg-raised fill, 2px gold left+right borders); `STEWARD` (primary label, transparent, 2px primary left+right borders). A steward line may end with a `[open ↗]` link (primary).
- **INTERACTIONS:** type in the input; Enter sends, Shift+Enter inserts a newline; `▶` sends; blank input is ignored; `NEW CHAT` clears the transcript back to the empty state. There is no scope dropdown (removed): guild context = the left column's selection or the guild named in the message.
- **Placeholder:** `Ask the steward...`.
- **COMMANDS (matching is on lower-cased text, evaluated in this order — first match wins):**
    1. `log a defect in <guild>: <text>` (variants: `log defect/def/bug`, `in|to|for|on <guild>`) → adds a DEFECT bounty (origin steward, age `0m`, state live) at the top of that guild's board, bumps that guild's bounty count; reply `Logged DEF in <guild> [open ↗]`; `open ↗` opens BOUNTY MODE on the new row. Unknown guild → `I do not know a guild called "<x>".`
    2. `log a defect: <text>` (no guild) → uses the selected guild; if ALL GUILDS is selected → `Which guild? Try: log a defect in codex: <text>`.
    3. `promote <words>` → finds the first LIVE bounty whose title contains all the words (ignoring `the, page, quest, me, show, focus, on, to, open, a, idea, defect, bounty, about`); promotes it: bounty becomes `promoted` with a ↗ link to a new quest (status `created`), that quest is appended to QUESTS and to the END of QUEUED; reply `Promoted "<title>" to a quest in <guild>. It is at the end of the queue. [open ↗]` (opens the quest's focus view in the right pane). No match → `I could not find a live bounty matching "<words>".`
    4. anything matching `health` (e.g. `health`, `show health`) → right pane switches to HEALTH; reply `Focused the right pane on HEALTH.`
    5. `bounties|bounty [board] [for|in|of] <guild>` → right pane switches to a BOUNTIES list for that guild; reply `Focused the right pane on bounties for <guild>.` (unknown guild falls through).
    6. `focus [on] <words>` / `show me <words>` / `open <words>` → finds a quest whose title contains all the words (stop words ignored); right pane switches to that quest's focus view; reply `Focused the right pane on <title>.` No match → `I could not find a quest matching "<words>".`
    7. any message containing `block` → `Two quests are blocked: codex / Rate-limit guardrail holds the queue (waiting on the 5h window) and acme-web / Checkout address form validation (failing ward lint).` (no focus change)
    8. otherwise → `I can focus the right pane for you: try 'focus login page', 'show health' or 'show bounties for siegelense'. Otherwise I'll just answer here.`
- **RULES:** a focus command never changes the right pane's width; the pane header then shows `← RAID` and the breadcrumb.
- **MOCK-ONLY:** the whole parser is a regex stub; replies are canned; no streaming, no real model.

---

## 5. Right pane (normal mode) — frame, header, divider

- **Layout:** `[divider handle] [pane]`. Pane = a full-width bar, an optional breadcrumb line, then the body.
- **Top
  bar:** on RAID it reads `RAID` (active state: gold text, gold border, bg-raised, no pointer). On any focused view it reads `← RAID` (surface fill, border, pointer) and returns to RAID. Under it, on focused views, the breadcrumb (gold, bold, ellipsis): `FOCUS · <quest title>`, `FOCUS · HEALTH`, `FOCUS · EPIC · <epic title>`, `FOCUS · BOUNTIES · <guild>`.
- **Body:** RAID is a self-scrolling panel (body itself does not scroll); every other view scrolls the body vertically; horizontal overflow hidden and long words wrap.
- **FIXED WIDTH
  RULE:** the pane's width never changes when switching what it shows (RAID ↔ quest ↔ health ↔ epic ↔ bounties ↔ question ↔ ward-fail); measured 400px for all of them at 1600 and 1280. It changes only by dragging the divider.

### 5.1 Resizable divider

- **STATES:** an 8px hit area between the middle column and the pane with a 1px line and a small `⋮` grip; resting colours border/dim; on hover or while dragging the line, grip border and glyph turn gold and the area gets a faint gold wash. Cursor `col-resize`. Title `Drag to resize · double-click to reset`.
- **INTERACTIONS:**
    - Drag left/right → the pane width follows the pointer (text selection is suppressed during the drag). Clamped to min 320px and max 60% of the frame row.
    - Release → width saved to localStorage for the current mode (`cc-pane-w-normal` / `-quest` / `-bounty`); survives reload.
    - Double-click → clears the saved width, back to the default (normal 400px; quest/bounty 40%).
- **RULES:** each mode keeps its own width; switching modes restores that mode's width; width never changes through content. (Measured: bounty mode 616 → 780 after dragging 160px left, still 780 after reload, 616 after double-click, at 1600; 488 → 652 → 652 → 488 at 1280.)
- **MOCK-ONLY:** nothing — this is intended behaviour.

---

## 6. RAID panel (right pane's default view)

Framed panel (1px border, bg-surface). Everything running or waiting is a lane in one of three drawers, in this order.

### 6.1 Panel header

- **STATES:** `RAID · 6 need you · 4 running · 5 queued` (`RAID` gold bold; `N need you` red when N>0; when dispatch is paused, ` · paused` is appended) + primary `PAUSE` button (label `PLAY` when paused).
- **INTERACTIONS:** `PAUSE`/`PLAY` toggles dispatch: queued lanes dim to 60% opacity, the QUEUED sub-header gets ` (paused)`, the health strip's dispatch cell flips to `paused`, the header chip button flips.
- **Counts stay visible whichever drawers are collapsed.**

### 6.2 Drawers

- **Sub-headers (clickable, 9px dim, `▾` open / `▸` closed + label +
  count):** `NEEDS ATTENTION (6)`, `ACTIVE (4)`, `QUEUED · dispatch order (5)` (+ ` (paused)` when paused). Title attr `Collapse`/`Expand`.
- **INTERACTIONS:** click a sub-header → collapses/expands that drawer only; state persisted in `cc-raid-collapsed`. The whole list scrolls inside the panel when it doesn't fit (as at 1280x800, where the lower QUEUED lanes need a scroll).
- NEEDS ATTENTION empty copy: `Nothing is waiting on you.`

### 6.3 Lane anatomy (all lanes)

- Click a lane → right pane focuses that item (§8). The `↗` at the lane's right end → opens QUEST MODE for that quest (title `Open quest chat`) and does not focus. Highlight: a lane gets a bg-raised fill + 2px gold left border when its quest is the open quest or the last one opened (so on return from quest mode its lane stays highlighted).
- Every lane except locked ones carries the token line `ctx 142k/1M ▬▬ · Σ 3.4M` (§6.7). Lanes of epic quests carry the `⛓ Command Center 2/3` marker (§6.8).
- Fixed lane heights, each lane clips its own sprite area (no overlap with neighbours): needs 54px, featured battle 100px, compact battle 48px (66px when it has an epic marker), queued 40px.

### 6.4 NEEDS ATTENTION lanes (4 kinds, each with its own animation)

Layout: 110px animated scene on the left, then `[KIND tag] quest title` / `guild · age[ · note]` / token line (+ epic marker). Left border in the kind colour. Seeded:
| kind | quest | age | note | |---|---|---|---| | APPROVE (gold) | codex / Guild idea backlog | 3h | — | | APPROVE (gold) | siegelense / Seeding recipe for headless instance | 40m | — | | BLOCKED (red) | codex / Rate-limit guardrail holds the queue | 1h | — | | BLOCKED (red) | acme-web / Checkout address form validation | 2h | — | | QUESTION (magenta) | acme-web / Login page | 6m | `Should the login keep a "remember me" cookie?` | | WARD FAIL (amber) | codex / Ward spawns its children as itself | 12m | `lint: 2 errors in packages/ward` |

Scenes (pixel-art heroes + CSS shapes; the same component renders the large version in focus views, at 2.5× scale):

- **APPROVE:** owl ranger holds up a scroll; a gold `!` pulses above; a sealed arched gate (two doors, red seal that glows) stands to the right.
- **QUESTION:** frog cleric taps a foot (stepped bob); a speech bubble with a bold `?` gently pulses.
- **BLOCKED:** rat warrior leans and pushes (slow rocking) against a grey boulder that shakes slightly but never moves.
- **WARD
  FAIL:** raccoon wizard lies on its back (rotated 180°) with three gold `★` circling its head; a lint goblin stands over it, bobbing.
- **Resolve
  animations** (play in the focus view, §8): APPROVE → doors slide open, seal fades, `!` disappears, hero hops; QUESTION → bubble pops (scales up and fades), hero hops; WARD FAIL → hero rotates upright, stars fade, goblin fades to 35%. BLOCKED has no resolve (no action).
- **LATER-FLAGGED:** none.

### 6.5 ACTIVE lanes (running quests) — "battle"

- **Featured lane (first running
  quest):** 100px battle scene: hero (scale 3) + monster (scale 3, flipped to face the hero), ground line. Idle bob (stepped), hero lunge every 3s, fireball sprite flies hero→monster at 30–60% of the cycle, monster hit-flash (brightness spike + 4px nudge) at ~60%, a floating `-12` damage number rises and fades. Overlaid text: title row (`codex / Ward spawns its childr…`, gold, ellipsis, title attr full), `codeweaver · 12m 04s · items 5/9`, token line, top-right `lint goblin ▰▰▰▰▱▱▱▱ 44%` (monster HP = `1 − done/total`; HP text turns amber when < 50% else red), `↗`.
- **Monster death cycle (every 8s, 1.5s
  long):** monster fades and sinks, HP shows `▱▱▱▱▱▱▱▱ 0%`, a green `+40 XP` pops and rises, then it respawns at its progress-derived HP. MOCK-ONLY (timer; real trigger would be a work item completing).
- **Compact lanes (other running
  quests):** 48px: hero (scale 2) lunging every 2.4s, text block (guild / full title ellipsis + hover; `role · 4m 41s · items 2/6`; token line; epic marker on its own line when present), then `▰▰▰▰▰▱▱▱`-style HP (title `<monster> N% HP`) and the monster (hit-flash on its own 2.4s cycle), then `↗`. Heroes/monsters seeded: codex ward-children = raccoon wizard vs lint goblin; siegelense = rat warrior vs flaky skeleton (HP 67%); acme-web login = frog cleric vs bug slime (HP 13%); codex RAID panel = owl ranger vs bug slime (HP 57%).
- **Elapsed time ticks every
  second** from the seeded value (`12m 04s` → `12m 05s` …). MOCK-ONLY seeds; real = live duration.
- **Roles
  seen:** codeweaver, siegemaster, spiritmender (WORK roles = battle; chaoswhisperer/queued/spec phases would be travel — only queued lanes use travel in the seed).

### 6.6 QUEUED lanes — "travel"

- Numbered `1.` … in dispatch order: `1. codex / Orchestrator starts tools fr…` (first one gold, others normal text; hover = full title), token line (`ctx —` when idle), a small walking hero (stepped bob, staggered phase) on the left, a scrolling dashed ground strip on the right (40px), `↗`.
- **Locked lane (epic step waiting on its
  predecessor):** instead of a walking hero, a drawn padlock; title dim; second line amber `waits on #2` + the epic marker; no ground strip; no token line.
- Paused dispatch dims the whole drawer.
- Seeded queue: Orchestrator starts tools…, Screenshot diff readings, Checkout address form validation, Steward chat (locked), Consumer jest skips ts-jest… (MOCK-ONLY oddity: that last quest is already `complete` — seed artefact).

### 6.7 Token line (everywhere it appears)

Format `ctx <current>/1M <bar> · Σ <total>`, 9px dim on lanes (10px in the chat header). `ctx` value is the highest session context of that quest (`—` if none); bar is 34px wide (48px in the chat header) — fill colour text-dim ≤70%, warning (amber) >70%, danger (red) >90%; the ctx value text takes the same amber/red. Totals format `NNNk` below 1000k else `N.NM` (one decimal unless whole: `1M`). Hover title: `Context now <x> of 1M · <total> tokens in total` (bar title: `N% of the context window`). Seeded to show all three colours: 142k (grey), 720k (amber), 930k (red).

### 6.8 Epic markers

`⛓ Command Center 2/3` in gold 9px (title `Epic: Command Center — step 2 of 3`); click → right pane focuses the EPIC view (does not focus the quest). Shown on NEEDS/ACTIVE/QUEUED lanes of epic quests.

---

## 7. Slide-overs (RAID and HEALTH)

- **STATES:** an overlay drawer pinned to the right edge of the main frame, 400px wide (max 90%), gold left border and a dark shadow, above everything in the frame; a transparent backdrop covers the rest of the frame. Top row: dim text `slide-over · Esc or click outside to close` + `✕` button (title `Close`). Under it the same pane as the normal right pane: `RAID`/`← RAID` bar, breadcrumb, body.
- **When it
  exists:** opened by the header chip (starts on RAID) or the health strip (starts on HEALTH) when the underlying view is a detail view (quest mode, bounty mode) or a focused right-pane view. In the plain RAID view the strip switches the pane instead and the chip is hidden.
- **INTERACTIONS:** `✕`, Esc, or a click anywhere outside the drawer → closes (slides out). Click a lane inside → that lane's focus view shows inside the drawer (with its own `← RAID`). An `↗` or "open quest" inside the drawer closes the drawer and opens quest mode; clicking a bounty row inside opens bounty mode and closes the drawer. The underlying view never moves or changes. Health strip's border is gold while a health slide-over is open.
- **Motion:** `transform: translateX(100% → 0)`, 180ms ease-out in, 190ms out; none under reduced motion.
- **RULES:** the slide-over never navigates away from the detail view; it uses the same RAID components and the same store (approving/answering inside it updates the counts in the chip too).

---

## 8. Focus views (right pane, also usable in the slide-over)

Every focus view that is about a quest leads with the BIG animated scene (full pane width), then the details.

### 8.1 Quest focus (from a RAID lane, or the steward)

- **Scene at the
  top** (priority): the clicked need's scene (if focus came from a NEEDS lane) → the running battle (featured-style 100px scene with the lane's title/role/elapsed/items/tokens) → a travel scene for queued quests (86px: parallax hills, scrolling ground, hero walking, text `queued · position N — travelling to the front of the line`) → nothing (a quest that is neither running nor queued, e.g. complete). A locked epic step shows no travel scene.
- **Header
  block:** quest title (gold, 13px bold); `guild <g> status <STATUS> role <role|—>[ elapsed <t>]`; for epic quests a clickable gold line `⛓ EPIC · Command Center 2/3[ · waits on #2]` (→ EPIC view); action buttons.
- **Actions:** `APPROVE` (primary; only for status review_flows / review_observables); `OPEN QUEST ↗` (ghost → quest mode); `PAUSE` / `RESUME` (ghost; toggles in_progress ↔ paused; disabled for complete/abandoned). Pause/resume changes the status word immediately; there is no other visible effect in the mock.
- **TOKENS
  block** (bordered box): `CONTEXT NOW` — one row per active session `<role> <ctx>/1M <90px bar> <N>%` (amber >70%, red >90%) or `no active session`; a line `in 4.5M · out 700k · Σ 5.2M` + right `est. cost $27.80`; `BY ROLE` — one row per role with a horizontal bar scaled to the largest role and the value (`2.6M`, `700k`…), or `nothing spent yet`.
- **Callouts (if the quest has pending needs):** QUESTION and WARD FAIL boxes (see 8.2/8.3).
- **WORK
  ITEMS:** vertical ledger; each row `glyph name STATE` — `✓ … DONE` (green), `▶ … IN PROGRESS` (primary, bg-raised, orange left border), `○ … PENDING` (dim, 70% opacity). Done count = items before the running one (running quests: from the lane's `done`; complete: all; others: 0 or a seeded count).
- **LOG:** boxed monospace lines, e.g. `[codeweaver] wrote packages/ward/src/brokers/spawn/spawn-broker.ts`, `[ward] lint: 2 errors in spawn-broker.ts`. Per-quest mock text.
- **MOCK-ONLY:** ledger names, logs, token numbers, costs are seeded per quest; unknown/new quests use a 5-item fallback ledger and a one-line log.

### 8.2 QUESTION focus

- Scene: frog + `?` bubble (big). Box `QUESTION FROM AGENT` (magenta): the question text and one ghost button per option (`Yes, 30 days`, `Session only`, `No cookie`).
- Click an option → resolve animation (bubble pops, hero hops, ~950ms; buttons are not re-clickable meanwhile), then the need disappears from NEEDS ATTENTION (counts and chip update), an activity line is logged in the store (not displayed any more), and the scene falls back to the quest's battle scene.

### 8.3 WARD FAIL focus

- Scene: knocked-down raccoon + goblin (big). Box `WARD FAILED` (amber): one entry per failing file — path:line:col, then the rule in amber on the next line (`no-unused-vars`, `prefer-const`) — and a ghost `RETRY WARD`.
- Click RETRY WARD → resolve animation (hero stands up, stars fade, goblin fades), then the need leaves NEEDS ATTENTION.

### 8.4 APPROVE focus

- Scene: owl with scroll + sealed gate (big). Quest header block with `APPROVE` (primary), `OPEN QUEST ↗`, `PAUSE`.
- Click APPROVE → buttons disabled for ~950ms while the gate opens, then: status → `approved`, the APPROVE need is removed, the quest is appended to QUEUED (so the scene becomes the travel scene), counts update.

### 8.5 BLOCKED focus

- Scene: rat pushing the boulder (big). Quest details; no resolve and no dedicated action in the mock (PAUSE/OPEN QUEST only).

### 8.6 BOUNTIES focus (steward `show bounties for <guild>`)

- Pane crumb `FOCUS · BOUNTIES · <guild>`. Compact bounty board for that guild (kind chips + rows). Row layout wraps: kind tag + title on line 1, `[state] origin age` on line 2. Clicking a row opens BOUNTY MODE (the old inline "selected bounty" box with PROMOTE/ABANDON still exists in the code but only appears if a highlight is passed in, which the steward links no longer do).
- Respects Show later features.

### 8.7 HEALTH view (health strip, or `health` to the steward)

Sections (single column):

- **ORCHESTRATOR:** `dispatch PLAYING|PAUSED`, `slots 3/4`, `event-loop lag 14ms`, `uptime 6h 12m`.
- **MODEL
  BACKENDS** — cards, each with name + state (`● UP` green, `● DEGRADED` amber) and stats `p50 1.8s · p95 6.4s · tok/s 74 · in flight 3 · err 1h 0.4%` (p95 amber when degraded; err red at ≥5%):
    - `Claude` with the rate-limit cards `[ 5h ▰▰▰▰▰▱▱▱ 62% (2h5m) ]` and `[ 7d ▰▰▱▱▱▱▱▱ 31% (3d4h) ]` (the real RateLimitCard look: bar 8 cells, % coloured by threshold, reset duration).
    - `ollama · qwen2.5-coder:32b` UP, GPU line `RTX 4090 VRAM 19.4/24 GB ▰▰▰▰▰▰▱▱` (amber when ≥90%).
    - `llama.cpp · deepseek-r1:14b` DEGRADED (p95 14.9s, err 8.6% red), `RTX 3090 VRAM 22.8/24 GB`.
- **ROLE
  ROUTING** table: columns `ROLE | BACKEND | REQ / 1h`: chaoswhisperer → Claude 41; codeweaver → ollama · qwen2.5-coder:32b 58; spiritmender → ollama · qwen2.5-coder:32b 17; siegemaster → Claude 26; flowrider → llama.cpp · deepseek-r1:14b 12; ward → `(no model)` `—`.
- **SERVER ERRORS ·
  1h:** `23 errors · last 38m ago`, the last error line (`500 POST /api/quests/q1/start — ENOENT: no such file or directory, open '.../quest.json'`), and `→ merged into DEFECT rows on the bounty board`.
- **LATER-FLAGGED:** SERVER ERRORS section; ROLE ROUTING rows backed by local models.
- **MOCK-ONLY:** all numbers; nothing live.

### 8.8 EPIC focus (epic row or ⛓ marker)

- Crumb `FOCUS · EPIC · Command Center`. Title `⛓ EPIC · Command Center`; sub-line `codex · 1/3 done · Σ 2.7M · est. $17.00` (Σ and cost sum the steps). `REORDER` (ghost; becomes primary `DONE`) toggles drag handles `⠿` on the steps and the hint `Drag the handles to change the execution order (mock).`
- Vertical chain: a numbered circle per step (✓ in green when complete) joined by a 1px connector; each step card shows title, status tag, `items d/t bar`, `Σ <tokens>`, and amber lock + `waits on #2` when blocked by an earlier incomplete step. Click a step → quest focus.
- **RULES:** a step is locked while any earlier step in the chain isn't `complete`; a locked step sits in QUEUED with the padlock.
**MOCK-ONLY:** reorder is cosmetic; no persistence; the epic definition is a constant and the seed has only codex "Command Center" (Bounty board record complete → RAID panel in progress → Steward chat waiting).
- **Activity
  view:** removed (RECENT ACTIVITY and its "more…" view no longer exist; the store still records activity lines internally but nothing displays them).

---

## 9. Quest mode

**Enter:** click a quest row (QUESTS tab, including epic steps), a RAID lane's `↗`, `OPEN QUEST ↗` in a quest focus view, or a promoted-bounty link.
**Leave:** `← COMMAND CENTER`, Esc, or clicking a guild / ALL SESSIONS in the column.

- **Layout:** header unchanged (chip now visible); frame = `[guild column or rail] [chat] [divider] [spec panel]`. The guild column starts collapsed (preference `cc-rail-detail`) and the DEVOUR toggle works in place. Spec panel default width 40% (616px at 1600, 488px at 1280), draggable (§5.1), fixed while switching SPEC/DETAILS. No giant logo, no raccoon above the transcript (the raccoon lives in RAID).
- **Transcript
  header:** `← COMMAND CENTER` (ghost, title `Esc`) · right-aligned context meter `ctx 142k/1M ▬▬` (same format/colours as §6.7; uses the quest's top session ctx, falls back to 202k for quests without one) · toggle `[ ] show details` / `[x] show details` (gold when on).
- **Seeded
  transcript** (identical for every quest except the title text injected): a user message, a ChaosWhisperer reply, a tool group, a reply with a bold `What I found` sub-heading and a three-bullet list (with inline code), a second tool group containing one failed call, a clarify box, a streaming reply (`Thanks. I'll draft the main flow first, then ▌`) and the line `● chaoswhisperer is writing…` (pulsing).
- **UNDERSTATED mode (default):**
    - Message chrome: 1px dim left rule only, no right border; role label small caps dim (`CHAOSWHISPERER`, `YOU`); one tiny dim token figure right-aligned on the label line (`1.2k`); hover title = the full context detail (`198.8k context (+2.1k) · claude-opus-5-5`). User messages: subtle gold tint background instead of a heavy border.
    - No per-turn context dividers and no `+3.6k context` line.
    - Tool calls: consecutive tool calls fold into ONE dim line `▸ 4 tools · Read ×2, get-project-map, Agent` (adds red ` · 1 failed` when any failed). Click → expands (`▾`) to today's full-width tool rows; successful ✓ stay dim-green, a failed call has a red border, red ✗ and `— <error>`.
    - Sub-agent chain: inside an expanded group, one dim line `▸ sub-agent · explore: how guild selection persists · 2m 14s ✓` (collapsed by default); click → its 3 nested tool rows.
    - Prominent (always): the **clarify
      box** (2px magenta border, `CHAOSWHISPERER ASKS`, the question in 13px, option buttons `Separate flow`, `Fold into main flow`, `Skip signed-out`, `Other…`; picking one replaces the buttons with `answered: <option>`), errors, the streaming indicator.
- **DETAILS mode (`show details`
  on):** today's chrome — 2px left+right coloured borders on every message (gold for you, orange for agent), label `CHAOSWHISPERER claude-opus-5-5`, `+N context` under each message, full-width context divider lines between turns (e.g. `196.7k context (+3.6k) · SubAgents · 315.1k`), every tool call as its own full-width bar `▸ Read /home/…/file ✓`, sub-agent chains expanded (header bar + indented children). Flipping the toggle keeps the same transcript.
- **Composer:** textarea placeholder `Reply to chaoswhisperer...`, `▶` send; Enter sends, Shift+Enter newline. MOCK: a sent message is appended as a YOU message; no reply is generated.
- **Auto-scroll:** the transcript starts scrolled to the newest and is bottom-anchored when short.
- **Spec
  panel:** title bar (gold quest title; `ABANDON QUEST` ghost → in place `CONFIRM ABANDON` (danger) + `CANCEL`; confirming does nothing further in the mock); tab bar `SPEC` / `DETAILS` (10px, primary underline). SPEC: status line (`EXPLORING FLOWS` for created/explore_flows, `REVIEWING FLOWS`, `REVIEWING OBSERVABLES`, `APPROVED`, `IN PROGRESS`, `PAUSED`, `BLOCKED`, `COMPLETE`, `ABANDONED`, coloured by status), `USER REQUEST` box, `FLOWS (0)` dashed box `No flows yet — chaoswhisperer is still exploring.` DETAILS: `DESIGN DECISIONS (0)`, `OPERATIONS (0)`, `TOOLING (0)` each `Nothing recorded yet.`
- **Header chip /
  slide-overs:** the chip is visible; clicking it slides RAID in (§7). The open quest's lane is highlighted when you return.
- **MOCK-ONLY:** one canned transcript for all quests; tool results, token figures and model name are constants.
- **Responsive:** at 1280 the transcript wraps to ~490px; chip/health abbreviations apply.

---

## 10. Bounty mode

**Enter:** click a bounty row (BOUNTY BOARD tab, BOUNTIES focus list), or the `[open ↗]` link on a steward "Logged DEF" reply.
**Leave:** `← COMMAND CENTER`, Esc, or a guild / ALL SESSIONS click.

- **Layout:** `[guild column/rail (preference cc-rail-detail, default collapsed)] [Sparkwright chat] [divider] [document panel]`; panel width 40% default, draggable, own persisted width `cc-pane-w-bounty`.
- **Sparkwright chat (
  middle):** header `← COMMAND CENTER` · dim `sparkwright · idea · codex` (kind lower-cased, guild) · `show details` toggle (same understated/details switch as quest chat). Empty state: centred dim `Sparkwright reads this document first. Ask it to flesh out, format, or add to it.` Composer placeholder `Describe your idea...`; Enter sends. Role label `SPARKWRIGHT` (understated: small caps dim).
    - Typed message → YOU entry + canned reply `(mock) Noted. I would update the document and keep the headings as they are.`
    - The chat transcript is per bounty and lives while the page lives (switching to another bounty and back keeps it; reload loses it).
- **Document panel — header
  band:** kind tag (IDEA gold / DEFECT red / FOLLOW-UP magenta) + title (the document's first line, gold) + buttons at the top right; line 2: `guild <g> origin <you|steward|tavern|srv-err> age <2h> [occurrences ×14] state <LIVE|ABANDONED|PROMOTED ↗ <quest>>`.
    - Buttons: `EDIT` (ghost; disabled while Sparkwright is updating) beside `ABANDON` (ghost; only when the bounty is live). While editing: `SAVE` (primary) + `CANCEL` (ghost) replace them.
- **Rendered document (the only reading mode — RAW/PREVIEW tabs were
  removed):** markdown renderer supports `#`–`###` headings (h1 gold, h1/h2 with an underline rule), paragraphs, `**bold**`, `*italic*`, `` `inline code` `` chips, `-` bullet lists, pipe tables (header row dim with rule, zebra rules), fenced code blocks (dark box, horizontal scroll), and images `![caption](path)` scaled to the panel width with a centred dim caption (screenshots copied to `public/mock/shot-1..3.png`). Panel scrolls; footer stays pinned.
- **Seeded
  documents:** `b1` IDEA "Show quest cost per role on the queue page" (headings, bullets, a table, three screenshots interleaved with paragraphs); `b4` DEFECT srv-err "500 on POST /api/quests/:id/start" (×14, a stack-trace code block, an occurrences table, one screenshot, a reproduce/expected/actual list); `b6` FOLLOW-UP tavern "Document dispatch hold notice in README" (bullets, one screenshot). Every other bounty (and any logged defect) gets a stub: `# <title>` / `Origin: **<origin>** · age <age>.` / `No further notes yet. Ask the Sparkwright to flesh this out.`
- **EDIT → SAVE / CANCEL flow:**
    1. EDIT → the rendered section becomes a gold-bordered monospace textarea holding the raw markdown (image lines visible as `![caption](path)`), autofocused; header buttons become SAVE / CANCEL; PROMOTE is disabled while editing.
    2. CANCEL → discards every edit since EDIT was clicked, back to the rendered view of the previous text.
    3. SAVE → back to the rendered view with the new text; if nothing changed, nothing else happens. Otherwise the middle chat gets a user entry `Edited the document — N line(s) changed: <first changed line, trimmed to 48 chars>`; after 0.6s Sparkwright replies `Read your edits. I tightened the wording around them and kept your structure.`; meanwhile a banner on the doc reads `● Sparkwright is updating…` (pulsing, EDIT disabled); at ~1.7s the doc gets a canned follow-up appended (`## Notes from Sparkwright` + a bullet) and a green banner `✓ Sparkwright applied a follow-up change: added "Notes from Sparkwright"` shows for 3.5s.

    - Line counting: positional line diff (every index where old ≠ new, plus length difference). MOCK: Sparkwright's follow-up text is the same canned section every time.
- **Footer action
  bar:** live → `PROMOTE TO QUEST` (primary; for DEFECT the label is `PROMOTE TO BUG HUNT`). Click → creates a quest (status `created`, title = bounty title, same guild), appended to QUESTS and to the END of QUEUED; the bounty becomes `promoted` (board row shows `↗ <quest>`; panel shows `PROMOTED ↗ <quest>` in the state field and footer `Promoted → <quest> ↗` — clickable, opens quest mode). Promoted bounties can't be abandoned or promoted again. Abandoned bounty footer: `Abandoned — nothing to promote.`
- **ABANDON:** click → in place `CONFIRM ABANDON` (danger) + `CANCEL` (ghost), no modal; confirm → state `abandoned` (board row dims, title struck through, `ABANDONED`).
- **MOCK-ONLY:** `PROMOTE TO BUG HUNT` creates an ordinary quest; documents live only in memory; ages and counts are fixed.
- **LATER-FLAGGED:** a bounty from a later-flagged origin can still be opened via a direct link, but it disappears from the board when the toggle is OFF.

---

## 11. Data seeded by the mock (for reference; none of it is a requirement)

- **Guilds:** codex, siegelense, acme-web.
- **Quests (13 + 3
  epic):** codex — Ward spawns its children as itself (in_progress, running), Guild idea backlog (review_flows), Orchestrator starts tools from the run folder (approved), Rate-limit guardrail holds the queue (blocked), Consumer jest skips ts-jest for CJS (complete), Quest delete confirmation popover (abandoned); epic Command Center = Bounty board record (complete), RAID panel (in_progress, running), Steward chat (created, locked). siegelense — Walk records console errors (in_progress, running), Seeding recipe for headless instance (review_observables), Screenshot diff readings (paused). acme-web — Login page (in_progress, running), Checkout address form validation (blocked), Dark mode toggle (complete).
- **Token seeds:** per quest `{ctx sessions, total, in, out, est. cost, per-role}`; context limit constant 1M.
- **Running:** codeweaver 12m04s 5/9; siegemaster 4m41s 2/6; spiritmender 31m17s 7/8; codeweaver 8m20s 3/7 (these tick up each second).

---

## 12. Keyboard and focus summary

| Key         | Where                                               | Effect                       |
|-------------|-----------------------------------------------------|------------------------------|
| Esc         | slide-over open                                     | closes the slide-over only   |
| Esc         | quest mode / bounty mode                            | returns to the normal layout |
| Esc         | normal mode, bounty EDIT, focused pane              | nothing                      |
| Enter       | steward input, quest composer, Sparkwright composer | send                         |
| Shift+Enter | same inputs                                         | newline                      |

(No other shortcuts. Tab order/ARIA not designed in the mock; clickable divs are not keyboard-focusable.)

---

## 13. Responsive: 1600x1000 vs 1280x800

- **1600:** header has full copy (`⚔ 6 need you · 4 running · 5 queued`, local model names in the health strip); quests rows show stats inline on one line; right pane 400px, middle ≈ 800px; RAID shows needs + active + a few queued lanes before scrolling.
- **1280 (< 1400
  rule):** chip → `⚔ 6 need · 4 run · 5 q`; health strip shows model dots only; QUESTS rows put stats on a second line; the steward hint line wraps to two lines; right pane still 400px (middle ≈ 570px); the RAID list needs its internal scroll to reach the lower queued lanes; quest-mode panel 40% = 488px; guild column toggle and all vertical positions identical (ALL SESSIONS at y=694, toggle at y=732).
- **Always:** header stays on one line; fixed lane heights; pane width only by dragging.

---

## 14. Known inconsistencies / things to decide before turning this into the real doc

- Seeded queue contains a quest that is already `complete` (mock artefact).
- Approving a quest in the mock queues it but never starts it; answering/retrying removes the need but never changes the running state.
- The BOUNTIES focus list still contains a vestigial "selected bounty" action box that the current links never trigger.
- The activity feed was removed from the UI but the store still records lines.
- ABANDON QUEST (quest mode) has no real effect after CONFIRM.
- Reduced-motion coverage is partial (see §0).
- Header chip appears when RAID is not visible; the health strip behaves differently (switches pane vs slides over) depending on whether the pane is already focused — worth deciding whether one rule is better.
- Epic data model (ordered chain, lock semantics, reorder) is a first take: lock = "any earlier step not complete".
