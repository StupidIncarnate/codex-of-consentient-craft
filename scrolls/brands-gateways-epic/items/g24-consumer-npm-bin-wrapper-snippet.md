# G24: Tell a consumer's agent how to add an npm or bin wrapper

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 35 (796-805); "Where the packages disagree" table (181-186); item 46 area (469-472, `create-package` handling a name under `packages/@gateway/`) |
| Needs | nothing |
| Unblocks | nothing directly |
| Packages touched | `shared` (session snippet), `@gateway/npm`, `@gateway/bin` (package.json `files`), `testing` (if the `__mocks__` file moves), `cli` (`create-package` refusal) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

`dungeonmaster init` gives a consumer repo dungeonmaster's `node` and `browser` gateways as their own
real source (copied in, not installed) — but the `npm` and `bin` gateways start EMPTY in a consumer,
with just a placeholder `src/index.d.ts`. Nothing tells an agent working in that consumer repo what to
do once it needs to wrap its first npm package or CLI program: where the new wrapper folder goes, where
to find dungeonmaster's OWN existing wrappers to copy the shape from (since an installed package ships
only `dist`, not the `src` a copy needs), when to delete the placeholder, and that it must never import
dungeonmaster's own gateway. This item writes that guidance into a session snippet, and settles two open
questions the source doc leaves for this item to decide.

## Current state

Checked 2026-09-26 against the code:

- **`files` field, confirmed per package** (`python -c "import json; ..."` against each
  `packages/@gateway/*/package.json`): `npm` → `["dist"]`. `node` → `["dist", "src"]`. `browser` →
  `["dist", "src", "__mocks__"]`. `bin` → `["dist"]`. This matches the source doc's table exactly:
  `npm` and `bin` ship `dist` only; `node` and `browser` also ship `src` (and `browser` additionally
  ships `__mocks__`).
- **`browser/__mocks__/jsdom-polyfills.cjs`** sits outside `src/`, and is the one file in the one
  package that ships a top-level `__mocks__` folder at all.
- **`create-package` has NO special handling for a name under `packages/@gateway/` today, and the gap
  is worse than "does nothing" — it silently produces the WRONG layout.** Reading
  `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.ts`:
  a name like `@gateway/foo` is detected as `isFullyScoped` (starts with `@` and contains `/`), so
  `packageName` is kept as `@gateway/foo` verbatim, but `directoryName` is computed by STRIPPING the
  scope: `name.slice(name.indexOf('/') + 1)` → `foo`. Reading
  `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts` (line 55-57):
  `packageRoot = join(targetProjectRoot, packagesDir, directoryName)` — with the default `packagesDir`
  (`packages`) and `directoryName = 'foo'`, this resolves to `packages/foo`, NOT `packages/@gateway/foo`.
  So running `dungeonmaster create-package --name @gateway/foo --type library` today would scaffold a
  new package at `packages/foo/` (a flat, top-level package, outside the `@gateway` group folder
  entirely) while stamping its `package.json` `name` field as `@gateway/foo` — a mismatch between where
  the package physically lives and what its own `package.json` claims, and a name that does not match
  the REAL gateway packages' published convention (`@dungeonmaster/npm`, not `@gateway/npm` — see the
  `<dungeonmaster-packages>` snippet and G23's item file for the `#gateway`-vs-`@gateway` naming
  question this touches too). Nothing refuses this call or warns about it.
- **What a consumer can actually read of dungeonmaster's OWN npm/bin wrapper source, checked
  2026-09-26:** the four gateway packages' `files` fields above mean an npm-installed
  `@dungeonmaster/npm` or `@dungeonmaster/bin` ships `dist` ONLY — no `src`. A consumer's agent has
  nothing locally to copy a wrapper's SHAPE from for these two kinds, unlike `node`/`browser`, whose
  `src` a consumer already has a full copy of (via `init`'s gateway source copy).

## Work

1. **Decide whether `npm` and `bin` stay `dist`-only, or start shipping `src` too, so a consumer's agent
   can read a real worked example the same way it can for `node`/`browser`.** The source doc leaves
   this open ("Whether `npm` and `bin` stay `dist`-only while item 35 has consumers write their own").
   **Recommended: ship `src` for `npm` and `bin` too, matching `node` and `browser`.** Reasoning: an
   agent working in a consumer repo has no way to browse dungeonmaster's own GitHub source mid-session
   (this repo's own `<dungeonmaster-searchStrategy>`/`discover` tooling only sees the CURRENT repo's
   `packages/**`, and a consumer's session has no special access to the dungeonmaster monorepo's
   history), so the ONLY reliable, offline way to hand it a worked example is through what it already
   has installed locally — `node_modules/@dungeonmaster/npm` and `.../bin`. Shipping `src` costs a
   little more package size for no behavioral change (per `packages/CLAUDE.md`'s own build-config
   split, `src` already ships alongside `dist` for two of the four gateway packages with no reported
   problem). The one thing to verify before finalizing this: whether shipping `src` for `npm`/`bin`
   also means shipping their `.proxy.ts`/`.stub.ts` test-support files (as `node`/`browser` do — its
   `files` field includes plain `src`, no exclusion), which is consistent with BR C6's own note that a
   package whose test support ships to consumers must include those files in its build; the
   `tsconfig.build.json` `exclude` list still keeps them out of `dist`, but the `files` field controls
   what leaves via `npm pack`/`npm publish`, and `src` is currently listed WHOLE, uncarved, for `node`
   and `browser`.
2. **Once decided, update `npm`'s and `bin`'s `package.json` `files` field** if the recommendation
   above is taken (add `"src"`), and confirm nothing in their build or publish pipeline currently
   assumes `dist`-only shipping in a way that would break (check `tsconfig.build.json`'s own `exclude`
   list for each, and any check that asserts the published `files` list, before changing it).
3. **`browser/__mocks__/jsdom-polyfills.cjs` — decide where test setup belongs.** The source doc leaves
   this open too: "Whether test setup belongs in a gateway package at all, or in
   `@dungeonmaster/testing` beside the other jest setup files." **Recommended: move it to
   `@dungeonmaster/testing`**, beside `jest.setup-global.js`, `jest.setup-global-teardown.js`,
   `jest.setup-home.js`, `jest.setup-io-trap.js` and `jest.setup.js` (all of which already live at
   `packages/testing/src/`). Reasoning: `testing` is already the one package whose whole job is
   shipping jest setup and test infrastructure to every consumer package (per BR's "What dungeonmaster
   ships for tests" table, quoted in several other item files in this epic); a browser-specific jsdom
   polyfill file is exactly that kind of shared test-setup concern, not gateway wrapper code, and
   keeping it in the gateway is the ONE place today that made `browser` ship a `__mocks__` folder no
   sibling gateway package ships. Moving it removes that one-off asymmetry the source doc's own
   "Where the packages disagree" table flags. Find every current reference to this file (its jest
   config `setupFiles`/`moduleNameMapper` entries, wherever they are) and repoint them at the new
   location.
4. **Write the session snippet.** New rule in
   `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` (a new snippet, or an
   addition to `<dungeonmaster-packages>` / a new dedicated one — check the existing snippet list for
   the best fit; this is likely its own new snippet given its narrow, specific audience: "a session
   working in a CONSUMER repo, needing to add its first npm or bin gateway wrapper"). It must say, in
   the plain-English, present-tense, one-idea-per-sentence style CLAUDE.md's comment-discipline
   requires for any instruction file:
   - A consumer's `packages/@gateway/npm/` and `packages/@gateway/bin/` start empty except for a
     placeholder `src/index.d.ts`.
   - To add the first wrapper for an npm package or a program, write it directly under
     `packages/@gateway/{npm,bin}/src/<subpath>/`, following the SAME layout every other gateway
     subpath uses (point at the `node`/`browser` copies already sitting in this same consumer repo as
     a live, local worked example, since those DID get copied by `init`).
   - Where to read dungeonmaster's own existing npm/bin wrapper SOURCE for a shape to copy: once step 1
     above is decided, this is either "the installed `node_modules/@dungeonmaster/npm/src` /
     `.../bin/src`" (if src now ships) or (if the decision goes the other way) whatever the operator
     decided instead — write the snippet to match whichever this item actually built, not both options.
   - Delete the placeholder `src/index.d.ts` once the first real subpath exists.
   - It never imports dungeonmaster's OWN gateway (only its own consumer-repo copy).
5. **`create-package` refuses, or handles, a name under `packages/@gateway/`.** Given the confirmed bug
   in "Current state" (a `@gateway/foo` name scaffolds to the wrong directory with a mismatched
   `package.json` name), **recommended: REFUSE it outright**, with a clear error message pointing the
   agent at this item's own new session snippet instead ("A gateway wrapper is not a
   `create-package`-scaffolded package — see the session snippet for adding an npm or bin wrapper").
   Reasoning: `create-package`'s whole scaffold (jest config, tsconfig, a full package seed per
   `packageTypeContract`) is built for a WORKSPACE package, not a single wrapper folder inside an
   existing gateway package — "handling" the name correctly would mean building an entirely different,
   narrower scaffold path just for this one case, which is more machinery than the problem needs when a
   plain refusal-plus-pointer is simple, safe, and correct. Add the check in
   `create-package-resolve-request-broker.ts` (or wherever the executing agent judges the name-shape
   decision belongs), refusing any `name` whose scope is `@gateway` (or, depending on how G23 resolves
   the `#gateway`-vs-`@gateway` naming question, whichever prefix ends up being the LIVE one) before it
   reaches the directory/package-name split logic that produces the bug.

## Lint rules this item adds or changes

None.

## Teaching text this item changes

| Where | Says today | Changes to |
|---|---|---|
| `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` | no snippet exists for adding an npm/bin gateway wrapper in a consumer repo | a new snippet with the guidance in Work step 4 |

## Done when

- [ ] The `npm`/`bin` `src`-shipping decision is made and recorded (either the `files` field is updated
      to add `"src"`, or a documented reason for keeping `dist`-only is recorded under DECISIONS).
- [ ] `browser/__mocks__/jsdom-polyfills.cjs` (or its replacement location) is decided and, if moved,
      every reference to it is repointed and the old file is deleted.
- [ ] A new session snippet exists covering: where a consumer's first npm/bin wrapper goes, where to
      read a worked example from, when to delete the placeholder, and the "never import our own
      gateway" rule.
- [ ] `create-package` refuses a name under the gateway's group-folder scope, with a message pointing at
      the new snippet, rather than silently scaffolding a mismatched package.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- The `create-package` bug this item found is not really about "gateway wrappers" per se — it is a
  general mismatch between how `isFullyScoped` computes `packageName` (keeps the scope) and
  `directoryName` (strips it) for ANY `@scope/name` input, not only `@gateway/...`. This item only has
  to REFUSE the gateway case specifically; do not attempt to fix the general scoped-name directory
  logic for every possible scope as part of this item — that is a separate, broader question (does
  `create-package` support scoped names pointing at a GROUP folder at all, for any scope?) outside this
  item's stated scope.
- Check G23's item file before finalizing whether the refusal (and the snippet's own wording) should say
  `@gateway` or `#gateway` — the two items may land in either order, and the two should agree on which
  prefix is the one an agent is actually told to use.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
