# G23: The discovery tools show the gateway as `#gateway`

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, "The discovery tools show the gateway as `#gateway`" (277-303), and line 429 (the `<dungeonmaster-packages>` snippet and `get-project-map`'s valid-name list) |
| Needs | [G12](g12-gateway-config-key-and-rules.md) (banned/restricted marks in the inventory output come from G12's config) |
| Unblocks | nothing directly |
| Packages touched | `shared` (project-map / project-inventory brokers), `mcp` (the responder that resolves `get-project-inventory`'s package path) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

A model searching for gateway code should be able to ask for it the same way it asks for any other
package — by name, through `get-project-map` and `get-project-inventory` — and get back something
useful: which of the four gateway packages (`npm`, `node`, `browser`, `bin`) holds what, which real
module each subpath passes through, and which exports the `gateway` config bans or restricts. Today
neither tool renders the gateway as one coherent thing.

## Current state

Checked 2026-09-26 by reading the actual broker code AND running it directly against this repo (via
`npx tsx`, not the MCP server itself, so this is the underlying logic's behavior, not a full
request/response trace through the MCP tool boundary):

- **`get-project-map`'s claim in the source doc no longer reproduces.** The doc says: "Measured
  2026-09-26: `get-project-map({ packages: ["node"] })` answers `Unknown package(s): node`." Running
  `architectureProjectMapBroker({ projectRoot: <this repo>, packages: ['node'] })` directly today
  returns a real result — a `# node [library]` section with "No execution flow to graph — a library
  package has no startup and no flows. Call `get-project-inventory({ packageName })` for its folders
  and files," not a thrown "Unknown package(s)" error. **This is because
  `discoverPackagesLayerBroker`** (`packages/shared/src/brokers/architecture/project-map/discover-packages-layer-broker.ts`)
  **already expands any `@`-prefixed "group folder" under `packages/` into its children as individual
  package names** — its own PURPOSE comment says exactly this: "a directory starting with `@` mirrors
  `node_modules/@scope/name` and is never a package itself, so its own children are listed under it
  instead." Running it directly against `packages/@gateway/` today returns `npm`, `node`, `browser` and
  `bin` as four separate discovered package names, each with `relativeDir: '@gateway/<name>'`. **Either
  the source doc's measurement predates this broker's current shape, or something outside the two
  functions this item read (a session-level allow-list, a different code path reached only through the
  real MCP stdio server rather than calling the broker directly) still blocks it — re-measure through
  the ACTUAL MCP tool (not a direct function call) before assuming the doc is simply wrong**, since a
  direct call skips whatever the responder or the MCP transport layer might add. Either way, the
  underlying discovery logic does not need a fix to find `node`/`npm`/`browser`/`bin` by name; what it
  is MISSING is grouping them under one `#gateway` identity with subpath/wrapper detail, which is the
  real remaining work below.
- **`get-project-inventory`'s claim DOES reproduce, and for a documented reason.** The doc says:
  "`get-project-inventory({ packageName: "@gateway" })` answers `## @gateway (0 files) (empty)`." Reading
  `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts` (lines 158-194)
  confirms why: it first checks whether `packages/<packageName>` exists DIRECTLY
  (`directPackageDir`), and only falls back to scanning `@`-prefixed group folders for a matching CHILD
  when the direct path does NOT exist. `packages/@gateway` DOES exist as a real directory (it is the
  group folder itself), so the direct-path branch wins, `packageDir` resolves to `packages/@gateway`,
  and `srcPath` becomes `packages/@gateway/src` — which does not exist, hence "(0 files) (empty)."
  **This same responder's group-folder fallback (lines 166-180) would find `packages/@gateway/node`
  correctly if called with `packageName: "node"`** — it uses the identical `@`-prefix scan logic as
  `discoverPackagesLayerBroker`. So today, oddly, `get-project-inventory({ packageName: "node" })`
  likely already works (falls into the group-folder branch since `packages/node` does not exist),
  while `get-project-inventory({ packageName: "@gateway" })` does not (the literal folder exists, so it
  never reaches the fallback). **Re-verify both calls through the real MCP tool before building
  anything**, since this item's whole job is deciding what `get-project-inventory({ packageName:
  "#gateway" })` (the NEW, canonical name, with the `#` prefix) should do, and neither of today's two
  behaviors is that.
- **The literal name `#gateway` (with the `#`) is not handled anywhere today.** Neither
  `discoverPackagesLayerBroker` nor the `architecture-handle-responder.ts` group-folder scan has any
  special case for a caller asking by `#gateway` — both work off directory names, and no directory is
  named `#gateway` (the real folder is `@gateway`). This item has to decide how `packageName: "#gateway"`
  (or `packages: ["#gateway"]`) maps onto the real `packages/@gateway/` directory, and how the FOUR
  real sub-package names (`npm`, `node`, `browser`, `bin`) are represented once a caller asks for the
  gateway as ONE package rather than four separate ones.
- **`<dungeonmaster-packages>` session snippet and `get-project-map`'s valid-name list.** The session
  snippet shown at the top of this conversation already lists `@gateway` as one entry (see the
  `<dungeonmaster-packages>` block: "**@gateway**" is the first bullet) — check
  `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` for the exact source string
  this renders from, since the source doc's own complaint is that the snippet and the tools should
  agree on the SAME name, and the snippet may need to change from `@gateway` to `#gateway` to match
  whatever this item decides the tools show.

## Work

1. **Decide, and document under DECISIONS, exactly what `#gateway` resolves to** in both tools. The
   source doc's own worked example (quoted below) treats it as ONE package with FOUR internal groups
   (`node`, `npm`, `browser`, `bin`), each holding named subpaths — not four separate top-level
   packages the way `discoverPackagesLayerBroker` treats them today. Recommended approach: special-case
   the literal name `#gateway` (or `@gateway`, whichever the tools' input contract ends up accepting —
   check `packageNameContract`'s current shape, which is an open, unbranded-enum string today) in both
   `architectureProjectMapBroker` and the `get-project-inventory` responder, routing it to a NEW
   rendering path that reads all four real sub-packages and formats them as the worked example below,
   rather than trying to make the generic single-package code path produce this shape.
2. **`get-project-map`'s rendering.** When `packages` includes `#gateway`, render (instead of the
   generic "no execution flow to graph" library notice) a section grouped by `node`/`npm`/`browser`/`bin`,
   each subpath line naming the real module it passes through and listing our named wrappers, per the
   worked example:

   ```
   ## #gateway [gateway] — outside packages, Node, the browser and installed programs, reached only through here

   ### node
     #gateway/node/fs             passes through 'fs'
         ours: existsSync, readFileSync, readJsonFileSyncIfExists, walkFilesSync, tailFile, …
     #gateway/node/fs__promises   passes through 'fs/promises'
         ours: readFile ✗ banned, use readTextFile, readFileIfExists, readJsonFile, pathExists, …

   ### bin
     #gateway/bin/claude
         ours: resolveClaudeCliPath, spawnStreamJson (orchestrator only), ClaudeNotInstalledError
   ```

   A name banned or restricted by the `gateway` config (from G12) is marked on its own line, per the
   example (`readFile ✗ banned, use readTextFile`; `spawnStreamJson (orchestrator only)` for a
   `restrictedTo` entry naming one package). This needs G12's config shape to exist before this
   annotation can be built — confirm G12 has landed first.
3. **`get-project-inventory`'s rendering.** `get-project-inventory({ packageName: "#gateway" })` should
   point at (or itself render) the same grouped structure — the source doc's own text says
   `get-project-map` "points at `get-project-inventory({ packageName: "#gateway" })` for its contents,
   as it does for any library package," so decide whether `get-project-inventory` renders the full
   subpath/wrapper detail itself, or whether it renders a folder/file rollup across all four real
   sub-packages the way it does for an ordinary package today (just resolved through the real nested
   directories) — the worked example above suggests the FULL wrapper-and-real-module detail belongs to
   `get-project-inventory`, since `get-project-map` only "points at" it.
4. **Keep the individual `npm`/`node`/`browser`/`bin` names working, or deliberately retire them** —
   decide whether `get-project-map({ packages: ["node"] })` should keep answering as it does today (a
   plain, ungrouped library section for just that one gateway package) alongside the new `#gateway`
   grouped view, or whether asking for `node` by itself should now be refused/redirected to `#gateway`.
   **Recommended:** keep the bare `node`/`npm`/`browser`/`bin` names working exactly as they do today
   (harmless, and useful when a caller genuinely only cares about one gateway package), and ADD `#gateway`
   as a new, additional way to see all four grouped together — this is simpler than changing existing
   behavior and risks fewer surprises for a model already used to asking for one gateway package by its
   bare name.
5. **`<dungeonmaster-packages>` session snippet.** Change `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`'s
   packages list entry from `@gateway` to `#gateway`, matching whatever name this item's tools actually
   accept. This is a SOURCE-level change (per CLAUDE.md's own rule: "Every rule about dungeonmaster's own
   operations lives in a session snippet… Change a rule THERE"); after building it, follow this
   checkout's own regenerate-and-re-run-init flow (`npm run build`, `npm link --workspaces`,
   `npm run init`) is the OPERATOR's job, not this item's — report "build needed" rather than running it.

## Lint rules this item adds or changes

None.

## Teaching text this item changes

| Where | Says today | Changes to |
|---|---|---|
| `<dungeonmaster-packages>` session snippet (`packages/shared/src/statics/session-snippet/session-snippet-statics.ts`) | lists `@gateway` | lists `#gateway` |

## Done when

- [ ] `get-project-map({ packages: ["#gateway"] })` (or whatever exact input form this item decides on
      — record it under DECISIONS) renders the grouped `node`/`npm`/`browser`/`bin` view with real
      per-subpath module names and our wrapper names.
- [ ] `get-project-inventory({ packageName: "#gateway" })` (same input-form caveat) renders useful
      detail rather than "(0 files) (empty)."
- [ ] A name banned or restricted by G12's `gateway` config is marked on its line in the rendered
      output.
- [ ] The `<dungeonmaster-packages>` session snippet source is updated to say `#gateway`.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- **Re-measure both tools' CURRENT behavior through the real MCP tool call, not just by reading/calling
  the underlying broker directly**, before writing any code — this item's own research (see "Current
  state") found the source doc's claim about `get-project-map` does not reproduce via a direct function
  call, which means either the doc is stale or something in the responder/transport layer this research
  did not exercise still causes it. Do not build a fix for a bug that may not exist without confirming
  through the actual tool path a live session would use.
- Do not conflate "the bare `node`/`npm`/`browser`/`bin` names resolve" (already true, per the direct
  function-call test above) with "the gateway is well presented" — the real gap this item closes is the
  GROUPED, richly-detailed `#gateway` view, not basic name resolution.
- G12 must land before this item can mark banned/restricted exports — if G12 has not landed, build
  everything else and leave the marking as a follow-up, noting it under LEFT STANDING.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
