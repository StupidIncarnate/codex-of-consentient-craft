# Post-mortem fix ledger — quest 1be07040

The post-mortem at `scrolls/reports/00-QUEST-1be07040-POST-MORTEM.md` is the record of what was
measured. This file is the record of what is being done about it. The post-mortem stays the place a
close is written down — a shipped fix gets its `E` finding and its `G` fix struck through there, with
what actually shipped written into the struck heading. This file only tracks work between "we agreed"
and "it merged".

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
echo "linked node_modules into $WT"
```

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

## Open items

Savings are the post-mortem's own figures, kept so the discussion order has a basis.

### (i) One-line changes

| Item | What it changes | Lane | Saving | Status |
|---|---|---|---|---|
| G3 | Wire `codeweaverScopeBlockTransformer` into the prompt renderer, or delete it | O | 21–48 min/quest | open |
| G4 | Print the edge id in the flow render; `.strict()` on `flowNodeContract` | S | 0.6–1.4 min/cell, 2 destroyed sign-offs, 3 spilled results | open |
| G5 | Re-measure or delete the `[GIT FORMS]` block | P | 2–4 min/cell, ~34 lines out of 3 prompts | open |
| G6 | Render a real path for the spiritmender's ward blob | O | 6.4 min/dispatch | open |

### (ii) Prompt edits

| Item | What it changes | Lane | Saving | Status |
|---|---|---|---|---|
| G7 | Hardened build ban into every sub-agent and fixer brief template | P | 79–237 min/quest of sub-agent wall clock | open |
| G8 | Commit checkpoint inside the siegemaster loop | P | up to 655 min of at-risk work, for ~10 min | open |
| G9 | Destructive-git ban into the fixer and sub-agent brief templates | P | ~140 lines destroyed once; the risk of all of it | open |
| G10 | Forbid grandchildren in every brief template | P | 4.5M–13M ctx-in and 3–11 min per affected item | open |
| G11 | Fix the brief template's `PROVE` check types | P | ~31 min of downstream repair | open |
| G12 | Rewrite step 5/6 to enumerate untracked files; move the diff read into step 5 | P | 10–25 min per greenfield cell | open |
| G13 | Cap a fixer; make it hand back a red test | P | ~35 min and ~200k output per occurrence | open |
| G14 | Scope the walker guide to the quest, not the operation item | P | 8–75 min per sibling flow | open |
| G15 | Move the off-map probes off the back of the queue | P | converts a total loss of security coverage into ~35 min spent early | open |
| G16 | Give the prompt a sub-agent outage rule | P | ~15 min per outage | open |
| G17 | Make the siegemaster operation text match what the prompt scripts | S | 0 min, 1 lie removed | open |
| G18 | Drop the unsatisfiable `FINDINGS:` instruction; give findings a real home | P + S | prevents a lost cross-cell observation | open |
| G19 | 38 smaller prompt edits, each separately justified | P | see the post-mortem's table | open |

**G19 is 38 rows, not one item.** Discussing it row by row would take longer than the fixes. The plan
is one scoping pass over all 38, grouped by which file they land in, then we review the groups.

### (iii) Design changes needing a decision

| Item | The decision | Lane | Saving | Status |
|---|---|---|---|---|
| G20 | Which of three shapes for the standards triple — serve once, slice by folder type, or fill the gaps first. The post-mortem says do the gap-filling first, because slicing a document that is missing answers pushes work onto the explorers | M + P | ~261,000 tokens/item, ~2.1M/quest; the gap-filling half is ~4.9M tokens/cell | open |
| G21 | Filter design decisions to the cell's own nodes in the `get-quest` render. Has to be decided together with G19's "make the map cover design decisions" row, because filtering too hard caused a whole extra wave on item [5] | M | 32% off every codeweaver's scope fetch | open |
| G22 | Who runs the whole-branch ward, and when. `85a6f3818` made it expressible; nobody is told to run it | S | ~31 min/quest | open |
| G23 | What an operator does when its own turn is 529ing. Three candidate homes: the dispatcher, the harness, or the ledger | P + O | 79.1 min on this quest, unbounded in general | open |
| G25 | Whether spec completeness is the riftcarver's job or something the flowrider audits | data | prevents 2 of 3 known-open defects reaching a human | open |

## Closed, and where the record lives

`E1`/`G1`, `E6`/`G2`, `E7` (mechanism half), `G24` and `H4` are struck in the post-mortem with what
shipped written into each struck heading. Nothing more is needed here.
