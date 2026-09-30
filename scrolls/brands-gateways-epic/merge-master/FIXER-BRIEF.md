# Merge-master fixer brief

You finish the merge of `master` into `gateway-pivot` for the files the operator named in your prompt. Read
`scrolls/brands-gateways-epic/agent-brief.md` first; its "What you never do" list binds you. Read the "Concessions"
table in `scrolls/brands-gateways-epic/EPIC.md` (every row). Both live in the gateway-pivot checkout.

## Where you work

- **W** = `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/worktrees/gp-merge-master`.
  Edit files in W only. Never edit the gateway-pivot checkout's `packages/`.
- W holds an uncommitted merge. Never `git add`, commit, reset, checkout or stash there. Reading git is fine:
  `git -C <W> show :2:<path>` (this branch's side), `:3:<path>` (master's side), `git -C <W> log master -- <path>`.
- Run ward from W: `cd <W> && npm run ward -- --only <checks> -- <paths>` (timeout 600000). Ward grades W from there.
- Other agents fix other folders in W at the same time. A typecheck red outside your files is theirs: report it.

## What happened to your files

1. This branch re-branded all code (brands on object contracts and their fields, standalone scalar brands plain) and
   deleted every `adapters/` folder (callers use `#gateway/<kind>/<subpath>` wrappers, or orchestrator directly).
2. Master's side is DEF-102 to DEF-168 behaviour fixes written in the old style.
3. `merge-master/resolve.cjs` took master's side of every code conflict hunk. The dropped side of each hunk is in
   `<W>/tmp/merge-master/lost-ours/<path>.md`.
4. `merge-master/plain-brand-residue.cjs` rewrote master's uses of deleted plain brands. Sites where going plain would
   drop a validation check are in `<W>/tmp/merge-master/plain-brand-leftovers.json`.
5. Adapter calls the script could not map are in `<W>/tmp/merge-master/adapter-kept.json`. The replacement for each
   deleted adapter is in `scrolls/brands-gateways-epic/merge-master/adapter-map.json`, with its `callShape` and
   `proxyShape` (gateway-pivot checkout).
6. Files master modified that this branch deleted stay deleted; master's diff for each is in
   `<W>/tmp/merge-master/du/<path>.diff`. Port the behaviour and its tests to where that code lives now.

## For each file you own, in this order

1. **Keep master's behaviour.** Read the DEF commit that changed the file (`git -C <W> log master -- <path>`). The fix
   must survive, and its test must still assert it.
2. **Restore pivot-only edits** from `lost-ours/<path>.md` where master's side dropped them: a `contract.parse` wrap
   on a built object, a gateway call replacing an adapter, a returned value (B18), a hand fix. Skip a lost hunk only
   when master's side already does the same thing another way; say so in your report.
3. **Fix every type error** in the file (`<W>/tmp/merge-master/diag-r2.json` lists them; re-check with typecheck).
4. **Port unmapped adapter calls** to their replacement from `adapter-map.json`, proxies included.
5. **Make its tests pass**, then lint.

## Operator decisions

- **A validating brand master still parses** (`readingCountContract`, `absoluteFilePathContract`,
  `buttonLabelContract`, ...): move the check into the owning contract field (owner + key brand, the c1e1ae7a4
  pattern) and parse through that field. Where no owner contract holds the value, add the field to the contract that
  parses the value at its boundary. Never drop the check silently.
- **An owner-id parameter** takes `Owner['field']` (concession 29). A caller holding a raw string parses it through
  the owner's field at its boundary (`guildContract.shape.name.parse(raw)`). Do not loosen the parameter.
- **A missing helper master's side calls** (`zodIssueParse`, `createMockDirent`, ...): find what this branch uses
  instead (`discover`), and use that. Recreate nothing this branch deleted without reporting it first.
- **New files master added** follow this branch's rules too (brands, gateway, per-file stub and proxy imports).

## Gate

`cd <W> && npm run ward -- --only lint,typecheck,unit -- <your files>`, then `--only integration` on any integration
test in your folders. Report the run ids.

## Report

End with the agent-brief sections (CHANGED, WARD, LEFT STANDING, DECISIONS, BUILD NEEDED, DELETIONS), plus:
- **LOST-OURS** — per lost-ours file you own: restored / not needed (why).
- **DEF CHECK** — per DEF commit touching your files: the test that proves its behaviour, and pass or fail.
