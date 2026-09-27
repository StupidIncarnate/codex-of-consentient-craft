# G25: `init` works end to end in a scratch consumer

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 40 (833-842) and item 41 (844-853) |
| Needs | [G03](g03-publish-testing-public.md) (publishes `@dungeonmaster/testing` publicly — item 41 names this as a known blocker), [G08](g08-node16-base-tsconfig-and-ts-jest.md) (the published base tsconfig's module-resolution fix — a consumer whose package tsconfig extends the published base directly needs this to resolve `#gateway/...` at all) |
| Unblocks | nothing directly; reruns at the end of the epic as [Z07](z07-finish-line.md) |
| Packages touched | none in this repo directly — this item PACKS and INSTALLS existing packages, it does not change their source, except to fix whatever the run finds broken |
| Checks to run | none of this repo's own ward checks apply directly; the "checks" this item runs are inside the SCRATCH CONSUMER (its own typecheck, tests, build) |
| Split | one agent |
| Runs alone | no |

## Why

Nobody has proven that a real, freshly-`init`-ed consumer repo actually works — only that the files land
and the configs get written (a prior scratch-consumer run, per the source doc). Two specific things are
unverified: whether `dungeonmaster init`, running from an INSTALLED copy (not this monorepo checkout),
finds the other dungeonmaster packages in the right place; and whether the node/browser gateway source
`init` copies into a consumer actually typechecks, tests and builds there. This item runs the whole
thing for real, in a location outside this repo, and fixes what breaks.

## Current state

Checked 2026-09-26 against the code and this worktree's own constraints:

- **The scratch consumer MUST live outside this repo's tree, in the OS `/tmp`** — not
  `<repoRoot>/tmp` (CLAUDE.md's own scratch-file rule is for THIS repo's scratch files; a consumer repo
  is a different thing and needs real filesystem isolation, not just a gitignored folder). The reason
  is mechanical, not stylistic: Node's module resolution walks UP from `process.cwd()` looking for the
  nearest `node_modules/<package>`. A scratch consumer created anywhere under this checkout (even
  `<repoRoot>/tmp/scratch-consumer`) would have this repo's own root `node_modules` sitting above it in
  the directory tree, and a bare `require('@dungeonmaster/mcp')` (or any other dungeonmaster package)
  would resolve to THIS repo's copy long before it ever looked at whatever the scratch consumer's own
  `npm install` put in its local `node_modules` — silently faking a "it works" result that proves
  nothing about a REAL consumer, which has no such parent tree to fall back on. This is exactly the
  same hazard the `<dungeonmaster-worktrees>` session snippet describes for a worktree not being
  hermetic — the fix here is the same: physical separation, not a config flag.
- **`packages/cli/bin/cli-entry.ts` sets `dungeonmasterRoot` four directories above the running bin.**
  In this repo, that resolves to the repo root. In a real consumer, the bin sits at
  `node_modules/@dungeonmaster/cli/dist/bin/`, so the same four-levels-up walk lands on
  `<consumer>/node_modules`, and `packageDiscoverBroker` then looks for
  `node_modules/packages/*/dist/startup/start-install.js` — which does not exist, since a consumer's
  installed packages are not laid out as `packages/*` under `node_modules`. This is UNVERIFIED against a
  real published install (the source doc says so explicitly) — this item is what actually runs it and
  finds out.
- **Known blockers from a prior scratch-consumer run**, per item 41: `@dungeonmaster/testing` is not
  published (G03's job — confirm it landed before this item, or this item will hit the same 404 the
  prior run did), and the browser gateway copy's tests need `jest-environment-jsdom` and `undici`,
  which `init` already lists in the browser gateway's `devDependencies` (check this is still true before
  assuming it needs no further work).
- **Which packages need `npm pack`, checked 2026-09-26:** the root `package.json` (name
  `dungeonmaster`, version `0.1.0-beta.1`) has no `bin` field of its own and is NOT what a consumer
  installs directly as the CLI — `dungeonmasterRoot`'s "four directories above the bin" logic (above)
  and `packages/cli/CLAUDE.md`'s own description ("The CLI package provides the `dungeonmaster`
  binary") both point at `@dungeonmaster/cli` as the real installable entry point. `packages/cli`'s own
  `package.json` has `publishConfig: { access: 'public' }`; so do `@dungeonmaster/browser`,
  `@dungeonmaster/npm`, `@dungeonmaster/bin`, `@dungeonmaster/node` (the four gateway packages),
  `@dungeonmaster/eslint-plugin`, `@dungeonmaster/web`, `@dungeonmaster/hydration`,
  `@dungeonmaster/config`, `@dungeonmaster/server`, `@dungeonmaster/siegelense` and
  `@dungeonmaster/shared`. **Several packages `devDependenciesStatics` (`packages/cli/src/statics/dev-dependencies/dev-dependencies-statics.ts`)
  lists as REQUIRED consumer devDependencies have NO `publishConfig` set today**: `@dungeonmaster/hooks`,
  `@dungeonmaster/mcp`, `@dungeonmaster/ward`, and (confirmed above) `@dungeonmaster/testing`. This does
  NOT block `npm pack` (packing works regardless of `publishConfig`, which only matters for a REAL
  `npm publish` to the registry) — it only means this item cannot rely on "has `publishConfig`" as its
  list of what to pack. **Recommended:** pack every package `devDependenciesStatics.packages` names as a
  `@dungeonmaster/*` entry, plus the four gateway packages (whether or not `init` lists them as a
  devDependency — the node/browser ones are copied as SOURCE, not installed, but `npm`/`bin` may still
  need packing if G24's own decision is to ship their `src` and a consumer ever needs to install one as
  a real dependency rather than starting empty), plus `@dungeonmaster/cli` itself (the thing that gets
  installed and run). Re-derive the exact list by reading `devDependenciesStatics` directly rather than
  trusting this item file's copy of it, since it can change before this item runs.

## Work

1. **Confirm G03 and G08 have landed.** If either has not, report this item as blocked rather than
   running into the SAME known failure the prior scratch-consumer run already hit.
2. **The operator builds first.** This item's own agent NEVER runs `npm run build` (per
   `agent-brief.md`'s standing rule) — report to the operator that a full, clean build
   (`npm run build:clean`, since `npm run check:published`-style grading needs a cold tree, per
   CLAUDE.md's own build-discipline table) is needed before packing, and wait for it.
3. **`npm pack` every package this item's "Current state" section names**, from THIS repo, into a
   location this item controls (its own scratchpad directory is fine for the tarballs themselves, since
   they are not test-created temp dirs and not committed source — they are intermediate build
   artifacts). `npm pack` is explicitly allowed for the agent per this item's own scope (unlike
   `npm install`/`npm link`, which `agent-brief.md` otherwise forbids) — the distinction is that packing
   reads this repo without installing anything into it.
4. **Create the scratch consumer under the OS `/tmp`** (NOT this repo's `tmp/`, NOT the session's
   scratchpad directory, which is itself likely under this repo's isolated temp area rather than a
   clean `/tmp` location — check where the scratchpad directory actually resolves before assuming it is
   far enough outside this checkout's directory tree; if there is any doubt, use a fresh
   `/tmp/dungeonmaster-scratch-consumer-<random>` directory instead). Give it a minimal npm-workspaces
   monorepo shape (CLAUDE.md's own "Important" note: "Every consumer repo is an npm-workspaces
   monorepo, with packages under `packages/*`" — a single-package repo is not a supported shape and
   should not be what this item tests).
5. **Install the packed tarballs into the scratch consumer.** This is explicitly allowed for the agent
   because the scratch consumer is OUTSIDE this repo (`agent-brief.md`'s "never `npm install`" rule is
   about protecting THIS repo's own `node_modules`/lockfile — it does not apply to a directory this item
   created for exactly this purpose).
6. **Run `dungeonmaster init` for real, from the installed `@dungeonmaster/cli` binary, inside the
   scratch consumer.** Watch specifically for `packageDiscoverBroker`'s path resolution (see "Current
   state" above) — this is item 40's whole open question. If it fails to find the other dungeonmaster
   packages, that is a real bug in `packages/cli/bin/cli-entry.ts`'s `dungeonmasterRoot` computation,
   and fixing it is in scope for this item (this item exists specifically to find and fix exactly this
   class of bug — do not just report it and stop).
7. **Once `init` completes, run the consumer's own typecheck, tests, and build** against the copied
   node/browser gateway source. Fix what breaks — the known, already-named blockers are
   `jest-environment-jsdom`/`undici` for the browser copy's tests (confirm `init` still lists them; if
   not, that is itself a regression to fix) — but do not assume these are the ONLY things that break; a
   real run may surface more.
8. **Note anything genuinely unfixable within this item's scope** (a bug in another package this item
   should not be editing) under LEFT STANDING, with the exact command and error that reproduces it, so
   the operator can route it to the right item or open a new one.

## Lint rules this item adds or changes

None — this item is a smoke test with fixes, not a rule-authoring item.

## Done when

- [ ] Every package this item packs is confirmed against `devDependenciesStatics` at the time this item
      runs (not against this item file's stale copy).
- [ ] A scratch consumer exists under the OS `/tmp`, outside this repo's directory tree, with the
      npm-workspaces `packages/*` shape.
- [ ] `dungeonmaster init`, run from the INSTALLED `@dungeonmaster/cli` binary inside the scratch
      consumer, successfully discovers and runs every package's `StartInstall`.
- [ ] The consumer's own typecheck, unit tests and build all succeed against the copied node/browser
      gateway source.
- [ ] Every bug this item found in `dungeonmasterRoot`'s resolution, or anywhere else in the `init`
      path, is fixed in THIS repo's source (not worked around only in the scratch consumer).
- [ ] Anything left unfixed is reported under LEFT STANDING with an exact repro.

## Traps

- **Do not create the scratch consumer anywhere under this checkout, including
  `<repoRoot>/tmp`.** This is the one CLAUDE.md scratch-file rule this item deliberately does NOT
  follow, for the mechanical reason explained in "Current state" — a consumer under this repo would
  silently resolve dungeonmaster packages from THIS repo's `node_modules` and fake a pass.
- This item's own agent never runs `npm run build` in THIS repo — only the operator does, and only once,
  before packing. Do not build twice, and do not build "just to be sure" mid-item; if something looks
  stale, report it rather than re-building.
- This item RERUNS in Z07, at the very end of the epic, once everything else has landed — do not treat
  a green result HERE as proof the epic's later Phase 2-5 work will not break it again. Z07's own item
  file is what actually gates the epic's finish line.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
