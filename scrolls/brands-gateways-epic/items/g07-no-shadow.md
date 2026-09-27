# G07: Turn on `@typescript-eslint/no-shadow`

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 38, lines 807-818 |
| Needs | nothing |
| Unblocks | nothing named in EPIC.md's table |
| Packages touched | `eslint-plugin` (the rule config), and potentially every workspace package (wherever a shadow is found and fixed) |
| Checks to run | `lint` for the measurement pass; `lint,typecheck,unit` per package once fixes land |
| Split | operator splits per package once the measurement pass names which packages have shadows; each package's fix is its own agent, 1 to 3 files per agent per the standing dispatch rule for cleanup work |
| Runs alone | yes, per package — an agent fixing shadows in a package edits many of that package's files, so EPIC.md's Runs-with column marks this "runs alone per package"; no other agent may edit the same package while its shadow-fix agent is active |

## Why

Gateway wrapper functions carry real package/API names such as `glob`, `stat`, `run` and `commit`, which
are also completely ordinary local variable and parameter names. When a caller's own parameter or local
variable happens to share a gateway import's name, the LOCAL name hides the import inside that scope.
TypeScript then reports the resulting call as "This expression is not callable", pointing at the CALL
SITE rather than at the actual clash — a confusing error that sends a debugging session in the wrong
direction. This already happened once: trial unit 10 hit it when MCP's file scanner took a `glob` pattern
PARAMETER while also importing the gateway's `glob` function.

No rule in this repo checks for shadowing today. The existing, off-the-shelf ESLint rule
`@typescript-eslint/no-shadow` already reports exactly this — a local name that hides an outer one,
including an import — and names both the shadowing and the shadowed declaration in its message. No custom
rule needs to be written; this is purely a matter of turning an existing rule on and cleaning up what it
finds.

## Current state

Checked 2026-09-26 against the code: neither `no-shadow` nor `@typescript-eslint/no-shadow` appears in
`eslint.config.js` (repo root) or in
`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` — both files
were searched and neither string was found. This confirms the source doc's claim that the rule is off
today.

Not checked: how many shadows exist across the repo right now, or which packages they concentrate in.
That is this item's first step, and it is a MEASUREMENT, not a guess — the number will be whatever the
first lint run finds, not a figure carried over from the source doc (the source doc gives no count for
this one; it explicitly asks the executing agent to measure it).

## Work

1. **Measurement pass first, before any fix.** Turn `@typescript-eslint/no-shadow` on LOCALLY (in a
   scratch copy of the lint config, or by running ESLint directly against a temporary config — never
   commit a half-on config) and lint the whole repo to see what it flags:
   `npm run ward -- --only lint` with the rule temporarily enabled, or a scoped run per package if a
   whole-repo lint is too slow for a first pass. Record, per package, how many violations the rule finds.
   This gives the operator the real shape of the work before committing to a split.
2. **The operator splits the fix by package** once the measurement is in, dispatching one agent per
   package with shadows, each agent fixing 1 to 3 files at a time (the standing cleanup-dispatch rule:
   "1-3 files per cleanup agent, maximum... optimise for throughput over correctness" otherwise).
3. **Each fix agent renames the shadowing local**, not the gateway import — the import's name is the
   real package/API name and should stay recognizable; the local variable or parameter is what gets a
   more specific name (e.g. a file-scanner's `glob` PATTERN parameter becomes `globPattern`, not the
   gateway's `glob` FUNCTION import). Confirm this convention holds by reading a sample of what the
   measurement pass flags before generalizing it as the fix for every case — a shadow of something other
   than a gateway import (e.g. two nested local scopes shadowing each other with no gateway involved) may
   call for renaming either side; use judgment, but prefer renaming the INNER (shadowing) name in general,
   since it is almost always the newer, narrower-scoped one.
4. **Once every flagged violation is fixed**, turn `@typescript-eslint/no-shadow` on for real in
   `eslint.config.js` (or wherever the repo's real rule set lives — confirm the exact config location
   before editing, since `config-dungeonmaster-broker.ts` composes rule sets that `eslint.config.js`
   itself may consume).
5. Re-run `npm run ward -- --only lint` (scoped to whatever was touched, then a full pass once every
   package's fix has landed) to confirm zero violations with the rule fully on.

## Lint rules this item adds or changes

- **`@typescript-eslint/no-shadow`** (off-the-shelf `typescript-eslint` rule, not a custom
  `@dungeonmaster` rule): turned ON repo-wide. Refuses a local declaration (variable, parameter, function)
  that shares a name with an outer-scope binding, including an import. Message and behavior are the
  rule's own, not authored by this repo. Whether it can run `'pre-edit'`: it needs no repo-wide index and
  reads only the file being edited via ESLint's normal per-file AST, so it is very likely
  pre-edit-eligible — the executing agent confirms this against the three pre-edit conditions (reads only
  the file being edited; needs no type checker; the file being edited can fix the violation) before
  tagging it, and tags it in `dungeonmaster-rule-enforce-on-statics.ts` if so.

## Done when

- [ ] The measurement pass's findings are reported: which packages had shadows, and roughly how many
  (a per-run figure, not a permanent count — see the `<dungeonmaster-commentDiscipline>` guidance on not
  hard-coding a count that will drift).
- [ ] Every flagged shadow is fixed by renaming the shadowing local, confirmed by re-running the rule
  with zero violations.
- [ ] `@typescript-eslint/no-shadow` is on in the real lint config (not just a scratch/local copy).
- [ ] A decision on the rule's `'pre-edit'` tag is recorded (on or off, with the reason) in
  `dungeonmaster-rule-enforce-on-statics.ts`.
- [ ] A full `npm run ward -- --only lint` exits 0 with the rule on.

## Traps

- Don't fix violations by renaming the GATEWAY import to something less recognizable just to dodge a
  clash — that defeats the whole point of gateway names matching the real package/API names. Rename the
  local shadowing name instead.
- This item's own dispatch is "runs alone per package" because a shadow fix touches many files across one
  package at once — don't let another agent edit the same package mid-fix, and don't let this item's own
  agents fan out across MULTIPLE packages at the same time without the operator's explicit per-package
  split.
- Turning the rule on in `eslint.config.js` before every violation is fixed makes `npm run ward -- --only
  lint` fail repo-wide the moment it lands — sequence matters: fix everything the measurement pass found,
  THEN flip the switch.

## Concessions made while executing
