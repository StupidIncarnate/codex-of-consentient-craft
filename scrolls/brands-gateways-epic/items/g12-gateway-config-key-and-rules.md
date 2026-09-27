# G12: The `gateway` key in `.dungeonmaster.json`, and the three lint rules that read it

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, "A `gateway` config in `.dungeonmaster.json` constrains the gateway as bugs arise", lines 213-261 |
| Needs | nothing |
| Unblocks | [G13](g13-mantine-render-to-testing.md), [G23](g23-discovery-tools-show-gateway.md) |
| Packages touched | `config` (the contract), `cli` (writes an empty key on `init`), `eslint-plugin` (the three lint rules) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent, or two if the operator wants the config contract/`init` half separated from the three lint rules — they share the same config SHAPE, so one agent doing both keeps that shape in one head |
| Runs alone | no |

## Why

Nothing bans an unsafe gateway export today. The Node module subpaths pass their real module through
with `export *` — `#gateway/node/fs` exports the raw `readFileSync`, `#gateway/node/child_process`
exports the raw `spawn` — and nothing stops any package from reaching for the unsafe raw form instead of
a safer wrapper, or from reaching a gateway export that should be restricted to one package (such as
`spawnStreamJson`, which only `orchestrator` should call). A `gateway` key in `.dungeonmaster.json` is
the mechanism this epic uses to ban or restrict exports AS BUGS ARISE, without hard-coding the ban into
the gateway's own source.

## Current state

Checked 2026-09-26 against the code:

- `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts` is
  `dungeonmasterConfigContract` (confirmed by reading the file). It is a `z.object({...}).refine(...)`
  with one top-level optional key per config section — `framework`, `orchestrationMode`, `routing`,
  `schema`, `architecture`, `orchestration`, `ward`, `dungeonmaster`, `devServer` — and a `.refine` at the
  end checking `dungeonmaster.port !== devServer.port`. There is NO `gateway` key today — confirmed by
  reading the whole file; the source doc's claim that "no `gateway` key, no validation... exist" holds.
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` was searched
  for `bannedExports` and `restrictedTo` and neither string appears anywhere in it — confirming no rule
  reads any such config shape yet.
- `packages/config/src/responders/install/create-config/install-create-config-responder.ts` is what
  `dungeonmaster init` runs to create or merge `.dungeonmaster.json` in a consumer (confirmed by reading
  it in full). Two paths exist inside it:
  - **Brand-new file** (lines ~127-143): builds a full seed object and parses it through
    `dungeonmasterConfigContract`. This is where a `gateway: {}` empty key would be added for a FRESH
    consumer.
  - **Existing file, missing `devServer.e2e`** (lines ~75-124): merges IN PLACE, preserving every other
    key, ADDING only `devServer.e2e.processes` — it does NOT today ensure a `gateway` key exists on an
    existing file that lacks one. This is a gap this item needs to decide about (see Work step 3).
  - **Existing file, ALREADY has `devServer.e2e`** (line ~89): returns `action: 'skipped'` and touches
    nothing — so an existing consumer repo that already ran `init` once (and thus already has
    `devServer.e2e`) would NEVER get a `gateway` key added by a later `dungeonmaster init` re-run, under
    today's logic, unless this item changes that skip condition too.
- The exact rule-option style this item's rules should copy already has a precedent, from
  `scrolls/brands-types-tests-rules.md` T6 (`ban-workspace-export-mocks`), lines 1872 and 2292 (quoted
  here so the executing agent does not need to open that doc):
  > "How a machine checks it: `ban-workspace-export-mocks`. The import specifier names one of the repo's
  > own workspace packages, is not a `.proxy` file, and is not the file's own package. The package names
  > come from the root `package.json` `workspaces`, so the rule works unchanged in a consumer repo.
  > `eslint.config.js` reads them once when it loads and passes them as a rule option, so the rule reads
  > no file and runs in the pre-edit hook."
  >
  > "A rule can run pre-edit only when... it reads only the file being edited... A value the config
  > computes when it loads is fine. `eslint.config.js` is evaluated on each run, so a rule option such as
  > T6's list of workspace packages costs no rule a file read."
  The same shape applies here: `eslint.config.js` reads `.dungeonmaster.json`'s `gateway` key ONCE when it
  loads, and passes the parsed `bannedExports`/`restrictedTo` arrays into each rule as a rule OPTION — so
  none of these three rules itself reads a file at lint time, which is what keeps them `'pre-edit'`-
  eligible.
- G13 (Mantine `render` move) needs this item specifically because it adds the FIRST real `restrictedTo`
  entry (the `render` example, GW lines 98-107) — that example is G13's to add, not this item's; this
  item only builds the MECHANISM (the config shape, its validation, and the three rules that enforce
  whatever entries exist).

## Work

1. **Add the `gateway` key to `dungeonmasterConfigContract`.** Following the file's own existing
   per-section pattern (an optional `z.object({...})` per top-level key):
   ```ts
   gateway: z
     .object({
       bannedExports: z
         .array(
           z.object({
             subpath: z.string().min(1).brand<'GatewaySubpath'>(),
             name: z.string().min(1).brand<'GatewayExportName'>(),
             use: z.string().min(1).brand<'GatewayExportName'>(),
             reason: z.string().min(1).brand<'GatewayBanReason'>(),
           }),
         )
         .optional(),
       restrictedTo: z
         .array(
           z.object({
             subpath: z.string().min(1).brand<'GatewaySubpath'>(),
             name: z.string().min(1).brand<'GatewayExportName'>().optional(),
             packages: z.array(z.string().brand<'PackageName'>()).min(1),
             reason: z.string().min(1).brand<'GatewayRestrictReason'>(),
           }),
         )
         .optional(),
     })
     .optional(),
   ```
   Match whatever brand-naming convention this epic's brands work (Phase 3/4, not yet landed) actually
   settles on for a NEW brand text — this item lands in Phase 1, ahead of the brands foundation phase, so
   use plain descriptive brand names for now and expect B-phase items to revisit them once the brand rules
   exist; note this under DECISIONS if a later item needs to rename these.
2. **`init` writes an empty `gateway` key.** In `install-create-config-responder.ts`:
   - Add `gateway: {}` to the brand-new-file seed object (alongside `dungeonmaster`, `devServer`, etc.).
   - **Recommended decision:** also extend the EXISTING-file merge path so a `gateway` key is added (as
     `{}`) to an existing `.dungeonmaster.json` that lacks one, using the SAME "merge preserving every
     other key" logic already built for `devServer.e2e` — not gated on whether `devServer.e2e` is already
     present, since these are two independent concerns (today's code conflates "has devServer.e2e" with
     "already ran init once", and a `gateway` key should not depend on that unrelated flag). This is
     **Recommended — the executing agent may change it with a reason in DECISIONS** if threading a second
     independent merge condition into this responder proves awkward given its current control flow;
     an acceptable fallback is a SECOND, small responder dedicated to the `gateway` key alone, run
     alongside this one during `init`, if that reads cleaner than complicating one file's branching.
3. **Build the three rules,** all reading `.dungeonmaster.json`'s `gateway` key as a rule OPTION computed
   once in `eslint.config.js`, never as a file each rule reads itself:
   - **Banned export.** Fails when a file IMPORTS a name listed in `bannedExports` from that subpath — the
     rule checks the IMPORTING file, not the gateway's own barrel, because a barrel's `export *` cannot
     selectively omit one name. Message names `use` (the safer replacement) and `reason`.
   - **Restricted use.** Fails when a file OUTSIDE the listed `packages` imports a `restrictedTo` subpath,
     or (when `name` is set) imports specifically that named export from it. `packages` names WHOLE
     workspace packages (`packages/*`), never a folder inside one.
   - **Config names exist.** Fails when a `subpath` in either list is missing from the real gateway, when
     a banned `name` is missing from the REAL outside module the subpath wraps, or when a listed package
     in `packages` is not a real workspace package. This is what turns an upstream rename into a lint
     failure instead of silently banning nothing.
4. **No allow-list, ever.** Any package may use any gateway export unless a `restrictedTo` entry says
   otherwise — do not build a rule that requires an explicit allow entry for every use; that inverts the
   design.
5. **Every `subpath` in the config is written in FULL**, starting with `#gateway/`, the exact text a
   caller's own import uses — not a bare module name, not a gateway-package-relative path.
6. Confirm `dungeonmasterConfigContract`'s existing `.refine` (the port-collision check) is unaffected —
   this item only ADDS a key, it does not touch the refine.

## Lint rules this item adds or changes

- **Banned export** (name TBD by the executing agent, following this repo's existing `ban-*` naming
  convention — e.g. `ban-gateway-export`): syntax-only, reads the config via a rule option. Tag
  `'pre-edit'` — it reads only the file being edited plus the config computed at load time, needs no type
  checker, and the file being edited can fix its own violation.
- **Restricted use** (e.g. `enforce-gateway-restricted-to` or similarly named): same shape, same
  `'pre-edit'` eligibility reasoning.
- **Config names exist** (e.g. `enforce-gateway-config-names-exist`): this one is DIFFERENT — it needs to
  check the `subpath`/`name`/`packages` values in the CONFIG against the real gateway's actual exports and
  the real workspace package list, which means reading OTHER files (the gateway's own source, the root
  `package.json` workspaces list), not just the file being edited. Per the brands doc's own three
  pre-edit conditions, this makes it **NOT pre-edit-eligible** — it runs in ward only, the same way C1
  (`require-contract-parse`) and C8 (`enforce-unique-contract-names`) are marked "No" for the same reason
  in that doc's own rule table. Do not tag this one `'pre-edit'`.

## Done when

- [ ] `dungeonmasterConfigContract` validates a `gateway` key with `bannedExports` and `restrictedTo`,
  both optional arrays, matching the shapes in Work step 1 (or a documented variant, under DECISIONS).
- [ ] `dungeonmaster init` writes an empty `gateway: {}` key into a brand-new `.dungeonmaster.json`, and
  (per the recommended decision) also merges one into an existing file that lacks it.
- [ ] All three rules exist, read the config as a rule option (never a file read inside the rule itself
  for the first two), and are proven against a staged violation of each kind.
- [ ] The "config names exist" rule is NOT tagged `'pre-edit'`; the other two ARE, unless DECISIONS
  records a reason otherwise.
- [ ] `npm run ward -- -- packages/config packages/cli packages/eslint-plugin` (narrowed to the actual
  touched files) exits 0.

## Traps

- Don't let any of these three rules read `.dungeonmaster.json` itself at lint time — the whole point of
  computing it once in `eslint.config.js` and passing it as a rule OPTION is what keeps two of the three
  rules cheap enough to run pre-edit, exactly like T6's workspace-package list.
- The `restrictedTo` example for `render` (the Mantine-wrapped `testing-library__react` case) is **G13's
  job to ADD, not this item's** — this item only has to make the MECHANISM correctly enforce whatever
  entries end up in the config, it does not itself add that specific entry.
- Don't build an allow-list. The design is deliberately permissive-by-default with explicit bans/
  restrictions layered on top — inverting that changes the whole feature's shape.

## Concessions made while executing
