# Marks and Human Verdicts — walkthrough

Case prefix: `MK` · Packages: `shared`, `orchestrator`, `server`, `web`, `mcp` · Main sources:
`scrolls/consolidated-plan.md` (Track 1, Track 3), `scrolls/consolidated-plan-units.md`,
`scrolls/consolidated-plan-handoff.md`, `scrolls/orcha-changes/26-signoff-retirement.md`,
`scrolls/orchestrator-step-engine-plan.md` §10

## What changed

`workItem.observations[]` is now the only sign-off record. Each observation carries a `mark` —
`met` / `cant-meet` / `unmet` (`unitMarkContract`, `packages/shared/src/contracts/unit-mark/unit-mark-contract.ts:12`)
— plus `evidence` and, on `cant-meet` only, a `toSettle` instruction. The old `signoffContract`,
`signoffTrackContract`, `signoffVerdictContract` and `signoffTracksStatics` are deleted; nothing in
production code still writes or reads a `codeweaverSignoff` / `flowriderSignoff` / `siegemasterSignoff`
field (confirmed by repo-wide search — the only hits left are historical scrolls, a negative test
literal in `verification-track-contract.test.ts:31`, and a comment in
`smoketest-flow-signoff-apply-transformer.ts:20`).

`verifyByHuman` is a bare optional boolean on a flow OBSERVABLE (`flow-observable-contract.ts:75-80`).
Any role may set it. A flagged observable resolves to the `human-check` verification method and is
excluded from every track's denominator by `stepScopeStatics` — no step anywhere lists `human-check`
in its `verificationMethods` — so it counts toward no track's `met`/`cant-meet`/`unmet`/`outstanding`
tally. It surfaces instead on `QuestSummary.humanChecks`
(`packages/shared/src/contracts/quest-summary/quest-summary-contract.ts:82-87`), judged by a person
through the `HUMAN CHECK` panel.

A person's judgment is a `human-verdict` quest note (`questNoteKindContract`, the sixth and only kind
allowed to omit `workItemId` — `packages/shared/src/contracts/quest-note/quest-note-contract.ts`'s own
header). `POST /api/quests/:questId/human-verdict` records it
(`packages/server/src/responders/quest/human-verdict/quest-human-verdict-responder.ts`), delegating to
`questHumanVerdictRecordBroker`
(`packages/orchestrator/src/brokers/quest/human-verdict-record/quest-human-verdict-record-broker.ts`),
which upserts a note named `human-verdict-<unitId>` — a second verdict on the same criterion REPLACES
the first rather than appending.

The owner also deleted the screencast hold and the "no recording" line: siegelense's `citationKindContract`
(`packages/siegelense/src/contracts/citation-kind/citation-kind-contract.ts:18`) carries exactly
`['verified-prelude', 'open-issue', 'walked-note']` — no `unjudged-screencast` member exists anywhere in
the tree (confirmed by search; only unrelated video-retention machinery in `packages/siegelense/src/brokers/cleanup/**`
still says the word "screencast").

## How to reach it

| Surface | How to reach it | Notes |
|---|---|---|
| Verification summary panel | Web UI, quest chat view, the `QUEST_SUMMARY` panel on the right | `npm run dev` from repo root; dev web is `http://localhost:4751` |
| `GET /api/quests/:questId/summary` | `curl http://localhost:4750/api/quests/<questId>/summary` | dev API port; see Setup |
| `POST /api/quests/:questId/human-verdict` | `curl -X POST http://localhost:4750/api/quests/<questId>/human-verdict -d '{"unitId":"...","outcome":"met","reason":"..."}' -H 'Content-Type: application/json'` | body validated by `humanVerdictInputContract` |
| `get-quest-summary` MCP tool | `mcp__dungeonmaster__get-quest-summary({ questId })` | this repo's own `.mcp.json` dogfoods the compiled MCP server — see root `CLAUDE.md` Scenario 1 |
| `modify-quest` MCP tool | `mcp__dungeonmaster__modify-quest({ questId, questNotes: [...] })` | used to contrast `human-verdict`'s workItemId exemption against every other note kind |
| `quest-work` MCP tool | `mcp__dungeonmaster__quest-work({ questId, workItemId, payload: { kind: 'observations', observations: [...] } })` | how a session writes a mark; needs a real dispatched work item, so most cases below hand-edit `quest.json` instead |

## Setup

1. `npm run dev` from the repo root (never a workspace-scoped `dev`). Reads `.dungeonmaster.json`:
   API on port `4750`, web on `4751`, home directory `<repo>/.dungeonmaster-dev/`.
2. You need one guild and one quest to hand-edit. Fastest path: use the web UI's "+ New Guild" button
   pointing at any local git checkout (even this repo works), then "+ New Quest" inside it — or, from a
   Claude Code session with this repo's MCP connected, call `create-quest`. Either way, note the
   `guildId` and the quest's `id`/`folder` the response gives you.
3. The quest's file lives at `<repo>/.dungeonmaster-dev/guilds/<guildId>/quests/<questFolder>/quest.json`.
   For every case that needs a specific flow/observable/mark shape, **hand-edit that file directly**
   (`jq` or a text editor) — there is no hydration recipe that seeds a `verifyByHuman` observable or a
   work item with real marks (confirmed: zero hits for `verifyByHuman` under
   `packages/hydration-recipes/**`). Mirror the shape in
   `packages/web/src/flows/quest-chat/quest-summary-human-check-verdict.e2e.ts:25-58` for the flow/observable,
   and `packages/web/test/harnesses/quest/quest.harness.ts:143-149` for a work item's `observations[]` shape
   (`{ unitId, mark, evidence, toSettle?, at? }`).
4. **A hand-edit is not live.** The browser only repaints on the `quest-modified` WebSocket broadcast,
   which a direct file write never fires. After a hand-edit, reload the browser tab (or re-issue the
   `curl GET .../summary`) to see it. The one exception is MK-11/MK-12 below, which must be driven
   through the real browser click so the POST really fires the broadcast.
5. Minimum quest.json to make the summary panel render anything: `status: "in_progress"`, one flow with
   one node carrying at least one observable, one operation item, and one work item whose
   `relatedDataItems` names that operation (`["operations/<opId>"]`).
6. Bring the quest back to a clean state (delete it, or `patchQuestStatus` back to `complete`) between
   cases that seed conflicting shapes, to avoid one case's leftover note polluting the next.

## Test cases

### Marks in the verification summary (web)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-01 | Seed a flow with one observable; give a codeweaver work item `assignedUnitIds: ["<flowId>:observable:<id>"]` and `observations: [{unitId, mark: "met", evidence: "..."}]`. Open the quest's COVERAGE section | `QUEST_SUMMARY_TRACK_MET` shows `1 met` in the success (green) colour for the `codeweaver` track row | `e2e`: `flows/quest-chat/quest-summary-under-raccoon.e2e.ts` (asserts four-count rows) | P2 | |
| MK-02 | Same, but `mark: "cant-meet"` with a `toSettle` string | `QUEST_SUMMARY_TRACK_CANT_MEET` shows `1 cant-meet` in warning (amber) colour | `unit`: `track-row-layer-widget.test.tsx` | P2 | |
| MK-03 | Same, but `mark: "unmet"` | `QUEST_SUMMARY_TRACK_UNMET` shows `1 unmet` in danger (red) colour — distinct from `QUEST_SUMMARY_TRACK_OUTSTANDING`, which counts units NO work item of that track has marked at all | `unit`: `track-row-layer-widget.test.tsx` | P2 | |
| MK-04 | With the `cant-meet` unit from MK-02, open the DEBT section | One `QUEST_SUMMARY_DEBT_ROW` reads `[cant-meet] [codeweaver] <unitId>`, its evidence line, and a `QUEST_SUMMARY_DEBT_TO_SETTLE` line prefixed `→` showing the `toSettle` text | `unit`: `debt-row-layer-widget.test.tsx` | P2 | |
| MK-05 | With the `unmet` unit from MK-03 (no `toSettle` — the field is invalid on `unmet`), open DEBT | The row shows `QUEST_SUMMARY_DEBT_SUCCESSOR` instead: "→ nothing hands this over; a successor is owed the work" — never a blank line | `unit`: `debt-row-layer-widget.test.tsx` | P2 | |
| MK-06 | With the `met` unit from MK-01, open DEBT | No row for that unit anywhere in DEBT — `met` is proven and is never debt, on any track | `unit`: `quest-summary-debt-contract.test.ts` (contract refuses `met`) | P2 | |

### The verifyByHuman filter — in-scope exclusion

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-07 | Seed a flow whose only observable carries `verifyByHuman: true`, on a node tagged for a package with an active codeweaver operation/work item. Open COVERAGE | The `codeweaver` track row's four counts (met/cant-meet/unmet/outstanding) show `0` across the board — the flagged unit contributes to none of them, even though the flow itself renders | `unit`: `quest-summary-build-transformer.test.ts` (`describe('humanChecks')`, ~line 1087: "No track's `verificationMethods` lists `human-check`") | **P1** — no e2e drives a real dispatched session against a `verifyByHuman` unit to confirm the exclusion end to end | |
| MK-08 | Same quest, call `get-quest-work` for that codeweaver work item (or inspect what a real dispatched session would be assigned) | The flagged observable's derived unit id is absent from the returned in-scope list — it never reaches an agent to mark | `unit`: `step-in-scope-units-transformer.test.ts` | P2 | |

### The human-check verdict panel (web)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-09 | Open a quest with **zero** `verifyByHuman` observables anywhere in its flows | No `HUMAN CHECK` section at all — `QUEST_SUMMARY_SECTION_HUMAN_CHECK` testid absent from the DOM (deliberately no "none" line, unlike every other section) | `unit`: `human-check-panel-layer-widget.test.tsx` ("no verifyByHuman criteria" describe block) | P2 | |
| MK-10 | Seed one `verifyByHuman: true` observable, no matching `human-verdict` note yet. Open the quest | `HUMAN CHECK` section renders one `HUMAN_CHECK_ROW`: the description text, a `HUMAN_CHECK_REASON` textarea, and two `PIXEL_BTN`s labelled `MET` and `NOT MET`. No `HUMAN_CHECK_VERDICT` yet | `e2e`: `quest-summary-human-check-verdict.e2e.ts` | P2 | |
| MK-11 | Fill the reason box, click **MET** | POST body is exactly `{ unitId: "<observableId>", outcome: "met", reason: "<text>" }`. The row swaps LIVE (no reload) to `HUMAN_CHECK_VERDICT` reading `[met] <reason>` in success colour, and the reason field/buttons are gone | `e2e`: `quest-summary-human-check-verdict.e2e.ts` (drives the NOT MET half of this pair) | P2 | |
| MK-12 | Same setup, fresh unit, fill reason, click **NOT MET** | POST body `outcome: "not-met"`; row shows `[not-met] <reason>` in danger colour | `e2e`: `quest-summary-human-check-verdict.e2e.ts` | P2 | |
| MK-13 | Leave the reason box empty (or whitespace-only, e.g. two spaces), try clicking MET or NOT MET | Both buttons stay disabled — `disableControls = reason.trim().length === 0` | `unit`: `human-check-row-layer-widget.test.tsx` | P2 | |
| MK-14 | Fill the reason, click MET, and try clicking either button again **immediately**, before the network response returns (throttle the connection in devtools if it responds too fast) | Both buttons are already disabled the instant the click fires (`submitting` flips synchronously) — no double-POST is possible | `none` — flagged as an explicit gap in `scrolls/consolidated-plan-handoff.md`: "The verdict buttons' in-flight disable has no test: `EndpointControl` in `packages/testing` cannot hold a mocked request open" | **P1** | |
| MK-15 | After MK-11/MK-12 records a verdict, **reload the browser tab** (full refresh, not just re-navigate) | The recorded verdict is still there — `HUMAN_CHECK_VERDICT` renders from the freshly-fetched `GET /summary`, not only from the live broadcast that first showed it | `none` — the e2e's own comment explicitly says the verdict is proven "not by a reload" | **P1** | |

### The human-verdict HTTP endpoint (curl)

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-16 | `curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:4750/api/quests/<questId>/human-verdict -H 'Content-Type: application/json' -d '{"unitId":"<flagged-id>","outcome":"met","reason":"watched it"}'` | `200`; quest.json gains one `human-verdict-<unitId>` note under `planningNotes.questNotes` | `integration`: `quest-human-verdict-record-broker.integration.test.ts` | P2 | |
| MK-17 | Same, `"outcome":"not-met"` | `200`; note's `outcome` is `not-met` | `integration`: same | P2 | |
| MK-18 | Same, `"outcome":"confirmed"` (any value outside `met`/`not-met`) | `400`, body `{"error":"Invalid human-verdict input"}` — the enum really is two values, not `unitMarkContract`'s three | `unit`: `human-verdict-input-contract.test.ts` | P2 | |
| MK-19 | POST with `unitId` naming an observable id that does not exist anywhere on the quest | `400`, body error text: `Quest <id> has no observable named "<unitId>".` | `unit`: `quest-human-verdict-record-broker.test.ts` | P2 | |
| MK-20 | POST with a `unitId` that exists but whose observable has no `verifyByHuman: true` | `400`, body error text ending `"<unitId>" ... is not flagged verifyByHuman — a human verdict can only be recorded against a verifyByHuman: true observable.` | `unit`: `quest-human-verdict-responder.test.ts` | P2 | |
| MK-21 | POST with the body missing `unitId` entirely | `400`, `{"error":"Invalid human-verdict input"}` | `unit`: `quest-human-verdict-responder.test.ts` | P2 | |
| MK-22 | Record a MET verdict on a unit, then record a NOT MET verdict on the **same** `unitId` with a different reason | `planningNotes.questNotes` still carries exactly ONE entry for that unit (id `human-verdict-<unitId>`) afterward — the second call REPLACES, not appends — and its `outcome`/`detail` are the second call's values | `unit`: `quest-human-verdict-record-broker.test.ts` (REPLACE-not-append is documented in the broker's own header) | P2 | |
| MK-23 | Inspect the note quest.json just wrote (MK-16) | The note object has **no `workItemId` key at all** — not `null`, absent — the one note kind allowed to omit it | `unit`: `quest-note-contract.test.ts` | P2 | |
| MK-24 | Contrast MK-23: call `modify-quest` with a `questNotes` entry of kind `open-question` and no `workItemId` | Refused: `workItemId is required on a "open-question" note — only a human-verdict note may omit it.` | `unit`: `modify-quest-input-contract.test.ts:683-699` | P2 | |

### get-quest-summary MCP tool

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-25 | On a quest carrying one `verifyByHuman` observable (unjudged) and one `cant-meet` debt unit, call `get-quest-summary({ questId })` | Text opens `# QUEST SUMMARY — \`<questId>\``, has a `## COVERAGE` section with `met N / cant-meet N / unmet N / outstanding N` per track, a `## DEBT (1)` section naming the mark/track/evidence/toSettle, and a `## HUMAN CHECK (1)` section listing the criterion — none of this combination (DEBT + HUMAN CHECK together, real content) is exercised by the existing integration test, which seeds neither | `integration`: `mcp-server-flow.integration.test.ts` (`describe('tools/call with get-quest-summary')`, ~line 1510) covers the shape with a mid-quest observable and an open-question note only | **P1** | |
| MK-26 | Call `get-quest-summary({ questId: "does-not-exist" })` | JSON error shape, `isError: true`, body matching `{"success": false, "error": "..."}` | `integration`: `mcp-server-flow.integration.test.ts:1603-1620` | P2 | |
| MK-27 | Record a human verdict (MK-16), then call `get-quest-summary` again | The `## NOTES` section shows a `human-verdict` group with count 1, and its note line — the same verdict also shows in `## HUMAN CHECK` above it | `unit`: `quest-summary-to-text-transformer.test.ts` | P2 | |

### Backward compatibility and retirement sanity

| ID | Do this | Expect | Auto coverage | Pri | Result |
|---|---|---|---|---|---|
| MK-28 | Hand-write a quest.json whose flow observable object carries the legacy fields `"codeweaverSignoff": {}, "flowriderSignoff": {}, "siegemasterSignoff": {}` alongside its normal fields (no `.strict()` on `flowObservableContract` — see `flow-observable-contract.ts:61-82`). Load it in the web UI and via `GET /summary` | Quest loads with no error; the summary renders normally; the legacy fields are silently stripped by `.parse()` and never surface anywhere (not in the JSON response, not in the UI) | `none` found — no test specifically pins this backward-compat path for the sign-off fields (a similar case exists for a different retired field pair, `designPort`/`needsDesign`, per `scrolls/consolidated-plan-handoff.md`'s "Design leftovers") | **P1** | |
| MK-29 | Add a mid-quest observable (`addedBy: "siegemaster"`, not `"spec"`) that also carries `verifyByHuman: true` | It appears in BOTH the `ADDED MID-QUEST` section AND the `HUMAN CHECK` section simultaneously — the two axes are independent | `unit`: `quest-summary-build-transformer.test.ts` ("observable added mid-quest AND flagged verifyByHuman", ~line 1226) | P2 | |
| MK-30 | Open any quest's summary panel and the browser's DevTools Elements/Network panels; search rendered text and the raw `/summary` JSON for `signoff`, `confirmed`, `unconfirmable` (case-insensitive) | Zero hits anywhere in the UI or the wire payload — marks read `met`/`cant-meet`/`unmet` throughout, and there is no `UNCONFIRMABLE` section (DEBT alone carries both non-`met` marks) | `none` — confirmed by static repo search (zero production hits outside comments/scrolls/negative-test-literals) but never asserted against the live rendered page | P2 | |
| MK-31 | Search the same summary panel (and, if a siegelense evidence prune/citation surface is reachable, that too) for "no recording" or "unjudged screencast" | Absent everywhere — `citationKindContract` (`packages/siegelense/src/contracts/citation-kind/citation-kind-contract.ts:18`) enumerates only `verified-prelude`, `open-issue`, `walked-note`; no screencast-hold UI exists | `unit`: `citation-kind-contract.test.ts` | P2 | |

- **Pri P1** — no automated test crosses the real surface for this case, or the only tests mock the boundary.
  These are the cases the walkthrough exists for.
- **Pri P2** — covered by tests, but worth one look on the real surface.
- **Pri P3** — well covered. Run it only if time allows.
- **Result** — blank until run. Then `pass`, `fail DEF-NN`, or `skip — <reason>`.

## Known open items

- **No recorder exists.** `scrolls/consolidated-plan-handoff.md` records two owner decisions that
  closed this: `verifyByHuman` and siegelense video are separate features, and the screencast hold was
  deleted rather than built out — so a `verifyByHuman` criterion is judged with no attached evidence by
  design, not as a gap.
- **The verdict buttons' in-flight disable has never had a test** (same handoff doc, "Known gaps" list)
  — `EndpointControl` in `packages/testing` cannot hold a mocked HTTP request open long enough to
  observe the disabled state mid-flight. MK-14 is the only way to see this today.
- **`questSummaryObservableContract.addedBy`'s description was written for mid-quest observables** and
  `humanChecks` reuses the same contract — cosmetic, not a defect, per the same handoff doc's "Known
  gaps, not yet units" list.
- Five orchestrator summary tests went red for several commits when the `human-verdict` note kind first
  landed (handoff doc, "Production bugs found and fixed this session") — worth an extra look at
  MK-25/MK-27 given that history.

## Sources

- `scrolls/consolidated-plan.md` — Settled Decisions 1 and 3 (sign-off re-homing, `verifyByHuman`).
- `scrolls/consolidated-plan-units.md` — Track 1 (T1-13/T1-15) and Track 3 (T3-20/T3-21) unit breakdowns.
- `scrolls/consolidated-plan-handoff.md` — owner decisions on video/screencast deletion, the two open
  scope questions closed, and the known gaps list.
- `scrolls/orcha-changes/26-signoff-retirement.md` — the full file-by-file retirement map.
- `packages/shared/src/contracts/unit-mark/unit-mark-contract.ts`,
  `packages/shared/src/contracts/unit-observation/unit-observation-contract.ts`,
  `packages/shared/src/contracts/quest-note-kind/quest-note-kind-contract.ts`,
  `packages/shared/src/contracts/quest-summary/quest-summary-contract.ts`,
  `packages/shared/src/contracts/flow-observable/flow-observable-contract.ts`.
- `packages/orchestrator/src/brokers/quest/human-verdict-record/quest-human-verdict-record-broker.ts`,
  `packages/orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.ts`.
- `packages/server/src/responders/quest/human-verdict/quest-human-verdict-responder.ts`,
  `packages/server/src/contracts/human-verdict-input/human-verdict-input-contract.ts`.
- `packages/web/src/widgets/quest-summary/*` (quest-summary, track-row, debt-row, human-check-panel,
  human-check-row, note-group-row, note-row widgets), `packages/web/src/brokers/quest/human-verdict/quest-human-verdict-broker.ts`.
- `packages/mcp/src/responders/quest/handle/quest-summary-layer-responder.ts`,
  `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts`.
- `packages/siegelense/src/contracts/citation-kind/citation-kind-contract.ts`.
