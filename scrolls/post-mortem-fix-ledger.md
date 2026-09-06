# Fix ledger — quest 1be07040

Two documents measured this quest and each proposed fixes:

| Document | Asked | Its fixes are numbered |
|---|---|---|
| `scrolls/reports/00-QUEST-1be07040-POST-MORTEM.md` | how each session ran, and what it cost | `G1`–`G25`, against findings `E1`–`E33` |
| `scrolls/reports/00-DELIVERY-CHAIN-AUDIT.md` | whether the approved flow map became the delivery it promised | `H1`–`H14` |

**The two lists overlap by about half.** Section "Open items" below merges them, so one row is one
piece of work whatever each document called it.

Those documents stay the record of what was measured, and the place a close is written down — a
shipped fix gets its finding and its fix struck through there, with what actually shipped written into
the struck heading. This file only tracks work between "we agreed" and "it merged".

## Out of scope: siegemaster

Another session owns making the siegemaster run its walks in parallel. Anything whose only edit lands
in `siegemaster-prompt-statics.ts`, `siegemaster-walker-statics.ts` or `siegemaster-reviewer-statics.ts`
belongs to that session, not this one. Rows below say so. Two rows are split, because half the edit is
in a siegemaster file and half is not.

## How a fix moves

| Status | Means |
|---|---|
| `open` | Nobody has looked at it since the post-mortem was written. |
| `scoping` | A sub-agent is reading the real files to find out what the fix actually touches. |
| `agreed` | The user and the session have settled what to change. Ready to dispatch. |
| `in flight` | A worktree holds it. The branch name is in the row. |
| `merged` | On `master`, ward green. Strike it in the post-mortem and delete the row here. |
| `dropped` | Decided against. Say why in the post-mortem, struck. |

## Why every fix gets a scoping pass first

Two fixes have shipped, and both were predicted small and were not.

| Fix | Predicted by the reports | Actually took |
|---|---|---|
| G1 — per-run Playwright report path | one line of TypeScript, by three reports | 5 files, including a `vite.config.ts` no report opened |
| G2 — ward sees untracked files | one broker, by four reports | 115 files, because fixing the flag meant renaming it |

So no item goes straight from "we agreed" to a fix agent. A scoping sub-agent reads the real files
first and reports what the change actually reaches. That pass is cheap and it is the only thing
standing between us and a third surprise.

## Lanes

A lane is a set of files. **One worktree may hold a lane at a time.** Lanes exist because most of the
remaining fixes edit the same three prompt files, so parallel worktrees would spend their time
merging each other rather than fixing anything.

| Lane | Files it owns | Notes |
|---|---|---|
| **P — prompt statics** | `packages/orchestrator/src/statics/{codeweaver-prompt,codeweaver-reviewer,flowrider-prompt,flowrider-reviewer,siegemaster-prompt,siegemaster-walker,siegemaster-reviewer,spiritmender-prompt}/` and their colocated tests | Strictly serial. Most open items live here. Several items can ride in one dispatch. |
| **O — orchestrator transformers** | `packages/orchestrator/src/transformers/work-item-to-prompt/`, `.../codeweaver-scope-block/`, `packages/orchestrator/src/brokers/**` | Runs beside P. |
| **S — shared transformers, contracts, statics** | `packages/shared/src/transformers/flow-graph-to-text/`, `packages/shared/src/contracts/flow-node/`, `packages/shared/src/statics/quest-type-registry/`, both `signal-back-input-contract.ts` | Runs beside P. |
| **M — MCP tools** | `packages/mcp/src/responders/**` behind `get-architecture`, `get-syntax-rules`, `get-testing-patterns`, `get-quest` | Runs beside P. |

Three items straddle two lanes and have to be split into two dispatches: **G18**, **G20** and
**G23**.

## The worktree protocol

Setup costs about 2.5 seconds, because `tmp/pm-worktree-setup.sh` symlinks `node_modules` back to the
main checkout rather than installing. That is the same shape `worktreePopulateNodeModulesBroker`
produces for quest worktrees.

```bash
git worktree add worktrees/pm-<gNN>-<slug> -b pm/<gNN>-<slug> master
tmp/pm-worktree-setup.sh /home/brutus-home/projects/codex-of-consentient-craft/worktrees/pm-<gNN>-<slug>
```

`tmp/` is gitignored, so the script is kept here too. Recreate it at `tmp/pm-worktree-setup.sh` and
`chmod +x` it if it is missing.

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="/home/brutus-home/projects/codex-of-consentient-craft"
WT="$1"

link_tree() {
  local src="$1" dst="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dst"
  for entry in "$src"/* "$src"/.bin; do
    [ -e "$entry" ] || continue
    local name; name="$(basename "$entry")"
    if [[ "$name" == @* && -d "$entry" ]]; then
      mkdir -p "$dst/$name"
      for scoped in "$entry"/*; do
        [ -e "$scoped" ] || continue
        ln -sfn "$scoped" "$dst/$name/$(basename "$scoped")"
      done
    else
      ln -sfn "$entry" "$dst/$name"
    fi
  done
}

link_tree "$ROOT/node_modules" "$WT/node_modules"
for pkg in "$ROOT"/packages/*/node_modules; do
  [ -d "$pkg" ] || continue
  pkgname="$(basename "$(dirname "$pkg")")"
  link_tree "$pkg" "$WT/packages/$pkgname/node_modules"
done

# Re-point every workspace package at THIS worktree's own source.
for entry in "$ROOT"/node_modules/@dungeonmaster/*; do
  [ -e "$entry" ] || continue
  name="$(basename "$entry")"
  target="$(readlink -f "$entry" || true)"
  case "$target" in
    "$ROOT"/packages/*)
      ln -sfn "../../packages/$(basename "$target")" "$WT/node_modules/@dungeonmaster/$name"
      ;;
  esac
done
echo "linked node_modules into $WT"
```

**Do not drop that last loop.** The main checkout's `node_modules/@dungeonmaster/x` is a relative
symlink to `../../packages/x`. Copying it by absolute path gives the worktree a link that resolves
back into the **main checkout**, so a build in the worktree compiles the main checkout's code and
ward grades it. That failure is silent: the run is green, the artifacts are byte-identical to before
the change, and nothing says the wrong tree was measured. It was caught once, on the first fix
dispatched through this protocol, by an agent that noticed its regenerated renders had not moved.

The fix agent works only inside that path. Before it reports done it runs, from the worktree root:

1. `git merge master` — pick up anything that landed while it worked.
2. `npm run build` — on its own, unpiped, exit 0 confirmed. Takes about 1m40s.
3. `npm run ward -- --only lint,typecheck,unit -- <every file it touched>` — a statics-file scope
   runs in about 25 seconds.

Then the session merging it runs a **full `npm run build && npm run ward` in the worktree** before
merging to `master`. Prompt text is asserted by tests in other packages, so a file-scoped ward cannot
see everything a prompt edit breaks. The full run is the gate that can.

```bash
git merge --no-ff pm/<gNN>-<slug>
git worktree remove worktrees/pm-<gNN>-<slug> && git branch -d pm/<gNN>-<slug>
```

## Merged

| What | Commit | Ward |
|---|---|---|
| A codeweaver reads every observable on a node its package tags | `55fc9655b` | `1788656577139-1c5e` |
| Every edge line names its own id; a labelled edge carries `◀ YOURS`; `flowNodeContract` gains `.strict()` | `5ede6d341` | `1788665074376-26a4` |

Both are struck in their source documents. The second closes **E5 / G4 / H2 / H3**; the first was in
neither document.

**Two dispatches, and both times the file list I handed the agent was short.** The first found the
`get-quest` MCP tool-schema `.describe()` and a result contract PURPOSE; the second found
`flowrider-reviewer-statics.ts` and `codeweaver-reviewer-statics.ts`. Tell every agent to sweep for
text describing the old behaviour rather than trusting the list — that is now measured twice, not
inferred from G1.

### Seam observables become readable — MERGED `55fc9655b`

**Neither document proposed this.** It came out of reading the real served materials, which are saved
under `tmp/codeweaver-materials/` — twelve artifacts generated by the repo's own transformers from the
live quest record, plus `SEAM-what-server-cannot-see.md`, which sets what one cell was shown beside
what it was not.

**What is wrong.** `flow-graph-to-text-transformer.ts:188-191` prints an observable only where the
observable's own `package` matches the calling package. On a node tagged with two packages, the rest
are replaced by a digit in the node's brace group. Measured on cell
`server · render-images-in-transcript`: **18 observables printed, 9 replaced by a digit.** One erased
line, on the node where `server` was building the `/api/images` route:

```
● #check-image-get-issued {web} the browser issues GET /api/images with a path query parameter
  holding the percent-encoded absolute path
```

That is the request shape the server's own handler has to answer.

**The fix.** Visibility routes by the **node's** package tags. Ownership is untouched — it stays the
observable's own `package` field, and a cell still signs only its own. So a cell sees everything on a
node it tags, and nothing on a node it does not.

**Why no `deferred` verdict is needed.** The quest's ten codeweaver `unconfirmable` verdicts were
checked one by one. **Every one was signed by the cell that owns the observable, and every one is a
layer limit** — needs a real browser, a live server, an integration testbed. **Not one is a cell
waiting on a sibling.** Ownership by the observable's `package` tag already puts each observable with
the cell that can prove it. The filter costs information, not correctness.

**Size.** Growth is at most 2,215 characters on any render, and all three stay more than 17,500 below
the 48,000-character ceiling.

## Open items

One row is one piece of work. The `Ref` column carries both documents' numbers where both proposed
it. `=` means the two proposed the same edit to the same file. Savings are whichever document measured
it more fully. `Owner` is `us` unless the siegemaster session owns it.

### (i) Code changes

| Ref | What it changes | Lane | Saving | Owner | Status |
|---|---|---|---|---|---|
| **G3 = H1** | Wire `codeweaverScopeBlockTransformer` into the prompt renderer, or delete it | O | 21–48 min/quest | us | open |
| **G4a = H2** | Print the edge id in the flow render | S | ~3.1 min/quest, ~400k chars of spilled tool result, 2 prompt-forbidden `stage:` calls | us | open |
| **G4b = H3** | `.strict()` on `flowNodeContract` | S | recovers 2 destroyed sign-offs; turns silent data loss into a visible error | us | open |
| **G6** | Render a real path for the spiritmender's ward blob | O | 6.4 min/dispatch | us | open |
| **H4** | Route the checklist header's denominator through the same filter as its remainder; correct the legend | O | 0 realized min on this quest; 3 measured over-counts and full exposure on every resume | us | open — **the audit only** |

### (ii) Prompt edits

| Ref | What it changes | Lane | Saving | Owner | Status |
|---|---|---|---|---|---|
| **H5** | Give the flowrider the siegemaster's licence to fix what no observable claims, and to author the observable for it | P | **205–467 min/quest** — the audit ranks it #1 | us | open — **the audit only** |
| **G7** | Hardened build ban in every brief template | P | 79–237 min/quest of sub-agent wall clock | codeweaver + flowrider us; siegemaster theirs | open |
| **G12 = H9a** | Enumerate untracked files; move the diff read into step 5 | P | 10–25 min per greenfield cell | us | open |
| **G5 = H9b** | Re-measure or delete `[GIT FORMS]` | P | 2–4 min/cell, ~34 lines out of three prompts | codeweaver us; siegemaster theirs | open |
| **G19-row = H6** | Name `get-qa-checklist` in the codeweaver prompt and in its reviewer | P | 0.2 min direct; four wrong counts and one falsely-reported compliance | us | open — the audit carries far more evidence than the post-mortem row did |
| **G14 + comp = H8** | Flow-scope the operator maps and the walker guide | P | ~84 min of guide authoring, ~30–37 min of flowrider duplication | codeweaver + flowrider map half us; guide path theirs | open |
| **G11** | Fix the brief template's `PROVE` check types | P | ~31 min of downstream repair | us | open |
| **G10** | Forbid grandchildren in every brief template | P | 4.5M–13M ctx-in and 3–11 min per affected item | codeweaver + flowrider us | open |
| **G9** | Destructive-git ban in the brief templates | P | ~140 lines destroyed once; the risk of all of it | codeweaver us; fixer half theirs | open |
| **G18** | Drop the unsatisfiable `FINDINGS:` instruction; give findings a real home | P + S | prevents a lost cross-cell observation | us | open |
| **G19** | 37 remaining smaller prompt edits | P | see the post-mortem's own table | mixed | open |
| **G8, G13, G15, G16, G17 = H7** | The siegemaster's commit checkpoint, fixer cap, off-map ordering, outage rule and test-suite review | P | — | **theirs** | out of scope |

**G19 is 37 remaining rows, not one item.** Discussing it row by row would take longer than the fixes.
The plan is one scoping pass over all of them, grouped by which file they land in, then we review the
groups.

### (iii) Design changes needing a decision

| Ref | The decision | Lane | Saving | Owner | Status |
|---|---|---|---|---|---|
| **H10** | Should the spec draw one node per route where routes differ in the code that serves them? Or should a package get a flow-less seam cell? Three HTTP routes converge on one `post-chat` node, so one of the three was built by nobody | design | 126.8 min of repair and 31.98 h of latency, on one bug — the audit ranks it #2 | us | open — **the audit only** |
| **H11 ⊃ G25** | Add the coverage check that runs node → observable. **G25 is the narrow version of the same thing** — mint flow 3's three known-missing observables now. H11 is the systemic version. Decide them together | M/S | prevents 2 of 3 known-open defects reaching a human | us | open |
| **G20** | The standards triple: serve once, slice by folder type, or fill the gaps first. The post-mortem says gap-filling first, because slicing a document that is missing answers pushes work onto the explorer fan-out | M + P | ~261,000 tokens/item, ~2.1M/quest; the gap-filling half is ~4.9M tokens/cell | us | open |
| **G22** | Who runs the whole-branch ward, and when. `85a6f3818` made it expressible; nobody is told to run it | S | ~31 min/quest | us | open |
| **G21** | Filter design decisions to the cell's own nodes in the `get-quest` render. Decide with G19's "make the map cover design decisions" row — filtering too hard cost a whole extra wave on item [5] | M | 32% off every codeweaver's scope fetch | us | open |
| **H14** | Print the seven off-map families as context on the codeweaver's and flowrider's checklists, without adding them to either denominator. Four of flow 1's nine late observables were pure concurrency or interruption cases on a composer | O/S | correctness; no minutes attributable | us — **but tell the siegemaster session, it touches their charter** | open — **the audit only** |
| **H13** | Which routing rule governs a glue unit: the owning node's tags, or the observable's own `package`. Both are deliberate and they disagree on every seam node | O/S | correctness | us | open — **the audit only** |
| **H12** | When a later role authors an observable inside a closed cell's scope, should the ledger mint a `pt N`, or should the unit record its arrival time? | S | closes 2 permanently open units | us | open — **the audit only** |
| **G23** | What an operator does when its own turn is 529ing. Three candidate homes: the dispatcher, the harness, or the ledger | P + O | 79.1 min on this quest, unbounded in general | siegemaster prompt half theirs; dispatcher half us | open |

### Open questions carried from the audit's §I

These are questions, not fixes. They need an answer before some rows above can be decided.

| Ref | Question | Blocks |
|---|---|---|
| I5 | Who or what paused the quest — a human, or an orchestrator-side timeout? Settling it needs the server-side ledger, which no report examined | whether flow 3's siegemaster ever runs, and so whether §E5's three defects are ever owned |
| I6 | Should the three questNote-only defects on flow 3 be minted as observables now? The counter-argument is the design's own: a session that did not measure a defect should not author its observable | G25 / H11 |
| I7 | Does `check-modal-is-three-quarters-wide` mean the viewport or the modal-inner content box? A product question, correctly left unanswered by an agent | nothing here — it is yours to answer |

## Closed, and where the record lives

`E1`/`G1`, `E6`/`G2`, `E7` (mechanism half), `G24` and `H4` are struck in the post-mortem with what
shipped written into each struck heading. Nothing more is needed here.
