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

## Plan

This plan covers only the REMAINDER named in EPIC.md's G24 row and the operator's dispatch brief: move
`packages/@gateway/browser/__mocks__/jsdom-polyfills.cjs` into `testing`, repoint every caller, and fix the
frontend-react seed's own duplicate (the F20 note). The npm/bin `src`-shipping and session-snippet work is
already committed (b6ce9b203, c03a24d4f, 64f3206f2) and is out of scope here.

Checked against code on 2026-09-27:

- **`packages/web/src/__mocks__/jsdom-polyfills.cjs` is a SEPARATE, pre-existing file** (read both:
  different comments, and web's copy alone stubs `global.performance.markResourceTiming`), referenced by
  `packages/web/jest.config.cjs:36` and named in prose at `packages/web/CLAUDE.md:535`. The item's Work
  step 3 only names the gateway's copy ("Find every current reference to THIS file") — web's copy and its
  jest config are a different file and are OUT of this item's literal scope. Flagged as an open question
  below rather than folded in.
- **`packages/cli/src/statics/package-seed-frontend/package-seed-frontend-statics.ts:87-136` already
  embeds a THIRD, inline copy** of this file's content, written into every scaffolded `frontend-react`
  package at `__mocks__/jsdom-polyfills.cjs` — this is exactly the item's own "F20 note," confirmed live
  (its own comment at line 93-94 names `packages/@gateway/browser`'s copy as what it mirrors).
- Two files this item's work touches — `packages/cli/src/transformers/gateway-package-scaffold-files/gateway-package-scaffold-files-transformer.ts`
  and its `.test.ts` — show as **modified in git status, but the diff is unrelated to G24** (it only
  reorders the `types` key earlier in each `exports` condition object — reads like F38's fix). Do not
  touch or revert this uncommitted, unrelated WIP.
- **`packages/testing/package.json` has no `undici` dependency today**, and `undici` (`^7.21.0`, resolved
  7.21.0 in `node_modules`) is currently only a `devDependency` of `packages/web`. The polyfill file does
  `require('undici')` — moving it into `testing` (a published package) needs `undici` added to `testing`'s
  real `dependencies`, or a real (non-hoisted) consumer install can fail to resolve it.
- **The generic (non-frontend-react) jsdom setupFiles mechanism already exists**, at
  `packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.ts:238`
  (`jestJsdomSetupFilesEntry`), consumed by
  `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.ts:202-203`
  for ANY seed with `jestKind === 'tsx-jsdom'`. Fixing this ONE static repoints every jsdom-kind
  `create-package` scaffold at once — it is not in the item's own "Packages touched" table and should be
  added.
- `packages/@gateway/browser/package.json:41` lists `"__mocks__"` as a third `files` entry (beside
  `dist`, `src`) — this is what makes `init`'s gateway source-copy step ship the folder to a consumer,
  confirmed by `packages/cli/src/flows/install/install-flow.integration.test.ts:372-375` asserting the
  copied `packages/@gateway/browser/__mocks__` directory holds `['jsdom-polyfills.cjs']`.

### Files

**Move:**
- DELETE `packages/@gateway/browser/__mocks__/jsdom-polyfills.cjs`
- CREATE `packages/testing/src/jsdom-polyfills.cjs` — same content as the deleted file (not web's
  differing copy — see the open question below).

**Registration:**
- `packages/testing/package.json` — add `"./jsdom-polyfills": "./src/jsdom-polyfills.cjs"` to `exports`
  (a plain string, matching the existing `"./jest-config-base": "./jest-config-base.js"` entry — no
  conditions object needed for a `.cjs` asset); add `"undici": "^7.21.0"` to `dependencies`.
- `packages/@gateway/browser/package.json` — remove `"__mocks__"` from `files` (leaves `["dist", "src"]`).

**In-repo jest configs (repoint the `setupFiles` entry from the old relative path to `'@dungeonmaster/testing/jsdom-polyfills'`):**
- `packages/@gateway/browser/jest.config.js:23` — `'<rootDir>/__mocks__/jsdom-polyfills.cjs'` → `'@dungeonmaster/testing/jsdom-polyfills'`.
- `packages/@gateway/npm/jest.config.js:23` — `'<rootDir>/../browser/__mocks__/jsdom-polyfills.cjs'` → `'@dungeonmaster/testing/jsdom-polyfills'`.
- `packages/testing/jest.config.js:21` — `'<rootDir>/../@gateway/browser/__mocks__/jsdom-polyfills.cjs'` → `'@dungeonmaster/testing/jsdom-polyfills'` (or a same-package relative path to `./src/jsdom-polyfills.cjs`, since `testing` now owns the file directly — either resolves; pick the one consistent with this file's other `setupFiles`/`setupFilesAfterEnv` entries, which already use `<rootDir>/src/...`).

**`init`-scaffold + generic create-package template:**
- `packages/cli/src/statics/gateway-package-template/gateway-package-template-statics.ts:66` — `browserJestConfigContent`'s `setupFiles: ['<rootDir>/__mocks__/jsdom-polyfills.cjs']` → `setupFiles: ['@dungeonmaster/testing/jsdom-polyfills']`.
- `packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.ts:238` — `jestJsdomSetupFilesEntry: "'<rootDir>/__mocks__/jsdom-polyfills.cjs'"` → `jestJsdomSetupFilesEntry: "'@dungeonmaster/testing/jsdom-polyfills'"`.
- `packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.test.ts:226` — same string, mirrored in the expected-value assertion.

**Frontend-react seed's own duplicate:**
- `packages/cli/src/statics/package-seed-frontend/package-seed-frontend-statics.ts` — delete the whole
  `{path: '__mocks__/jsdom-polyfills.cjs', contents: ...}` entry (lines 87-136); remove `undici:
  '^7.21.0'` from `devDependencies` (line 32 — no longer this package's own concern, `testing` carries
  it now; keep `jest-environment-jsdom`); rewrite the stale comment at lines 27-29 (it explains why
  `undici`/`jest-environment-jsdom` "back the `__mocks__/jsdom-polyfills.cjs` file below," which no
  longer exists in this file).
- `packages/cli/src/statics/package-seed-frontend/package-seed-frontend-statics.test.ts` — remove
  `'__mocks__/jsdom-polyfills.cjs'` from the `toStrictEqual` file-path-list assertion (~line 39); delete
  the `it('VALID: {type: frontend-react} => the jsdom polyfill file requires undici...')` test block
  (~lines 47-52+) entirely.

**Stale CLI test expectations (downstream of the seed change):**
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.test.ts` — remove the
  `'  __mocks__/jsdom-polyfills.cjs\n',` line (~192) from the expected output array; fix `'Wrote 12
  files.\n'` → `'Wrote 11 files.\n'` (~193).
- `packages/cli/src/flows/install/install-flow.integration.test.ts` — fix the assertion at ~372-375 that
  expects `testbed.listDir({relativePath: 'packages/@gateway/browser/__mocks__'})` to equal
  `['jsdom-polyfills.cjs']`; the directory no longer exists in a fresh `init` (nothing left in
  `@gateway/browser`'s `files` array ships it) — assert accordingly (an empty list, a thrown/not-found
  read, or delete the assertion, whichever `listDir`'s own contract returns for a missing directory).

### Batches

| ID | Files | Depends on | Runs beside | What it does |
|---|---|---|---|---|
| G24-1 | `@gateway/browser/__mocks__/jsdom-polyfills.cjs` (delete); `testing/src/jsdom-polyfills.cjs` (create); `testing/package.json`; `@gateway/browser/package.json` | — | — (land first) | Moves the file and registers it. |
| G24-2 | `@gateway/browser/jest.config.js`, `@gateway/npm/jest.config.js`, `testing/jest.config.js` | G24-1 | G24-3 | Repoints the 3 in-repo jest configs. |
| G24-3 | `gateway-package-template-statics.ts`, `package-scaffold-config-statics.ts`, `package-scaffold-config-statics.test.ts` | G24-1 | G24-2 | Repoints the `init` gateway-scaffold template and the generic jsdom-kind create-package template. |
| G24-4 | `package-seed-frontend-statics.ts`, `package-seed-frontend-statics.test.ts` | G24-3 | — | Removes the frontend-react seed's own duplicate copy, now that the generic template (G24-3) covers it. |
| G24-5 | `cli-create-package-responder.test.ts`, `install-flow.integration.test.ts` | G24-1, G24-4 | — | Fixes the two now-stale expected-output/listing assertions. |

G24-2 and G24-3 touch disjoint files and both depend only on G24-1, so they may run beside each other.
G24-4 must follow G24-3 (the generic template must already point at the new location before the seed's
own copy is deleted, or a scaffolded frontend-react package loses jsdom polyfills for one commit). G24-5
needs G24-4's file-count change and G24-1's directory change, so it runs last.

### Verification

| Batch(es) | Ward | Whole unit suites required after |
|---|---|---|
| G24-1 | `npm run ward -- -- packages/testing/package.json packages/@gateway/browser/package.json packages/testing/src/jsdom-polyfills.cjs` (ward may skip a bare `.cjs`/`.json` file; run at minimum `packages/@gateway/browser` and `packages/testing` scoped) | `@gateway/browser` and `testing` whole unit — every jsdom-environment test in both depends on this setupFile resolving. |
| G24-2 | `npm run ward -- -- <the 3 jest.config.js files>` | Same as above, plus `@gateway/npm` whole unit (its one jsdom-docblocked test file). |
| G24-3, G24-4 | `npm run ward -- -- <the 5 cli files>` | `cli`'s whole unit suite (create-package + install-flow tests only — no cross-package proxy composition here). |
| G24-5 | `npm run ward -- --only lint,typecheck,unit -- packages/cli/src/responders/cli/create-package/cli-create-package-responder.test.ts` and `npm run ward -- --only lint,typecheck,integration -- packages/cli/src/flows/install/install-flow.integration.test.ts` | `cli`'s whole unit + integration suites, since `install-flow.integration.test.ts` runs a real scratch `init`. |

### Build / consumer-resolution

- **`check:consumer` required before commit (EPIC rule 13).** This item changes a published package's
  `exports`/`dependencies` (`testing`), what `packages/@gateway/browser/package.json`'s `files` ships,
  and what `dungeonmaster init` writes into a consumer's copy of the browser gateway, plus what
  `create-package --type frontend-react` scaffolds. Run `npm run build:clean` then `npm run
  check:consumer` before commit.
- No build is needed to prove ward green (ward reads source), but `check:consumer` itself builds and
  packs every package as part of its own run.

### Conflict with G22

**G22 and G24 share no individual file**, but both claim the `@gateway/npm` and `testing` packages at
once: G22 touches `packages/@gateway/npm/package.json` + a new `packages/@gateway/npm/src/jest__globals/`
tree, plus `packages/testing/src/adapters/jest/**` and `packages/testing/src/adapters/child-process/mocker/**`;
G24 touches `packages/@gateway/npm/jest.config.js`, plus `packages/testing/package.json`,
`packages/testing/jest.config.js` and `packages/testing/src/jsdom-polyfills.cjs`. G22's own item header
already says "Runs alone: no — do not let another agent edit `testing` at the same time," and the
operator's own dispatch note already recommends sequencing G24 with or before G22. **Recommended order:
finish all of G24 (G24-1 through G24-5 — it is smaller and already 3 commits in) before starting any G22
batch**, so only one agent ever holds `testing`/`@gateway/npm` at a time.

### Open questions

- Whether `packages/web/src/__mocks__/jsdom-polyfills.cjs` (a separate, non-identical file) and
  `packages/web/jest.config.cjs:36` should ALSO be consolidated onto the same `testing`-owned copy now
  that the reason for two copies (per the gateway file's own removed comment — "the gateway takes no
  dependency on @dungeonmaster/web") no longer applies once both packages can depend on `testing`. This
  plan leaves web's copy untouched, strictly matching the item's own named scope; the operator decides
  whether a follow-up unit consolidates it (the two files differ: web's also stubs
  `performance.markResourceTiming`, so a merge is a real union, not a pure dedupe).
- Whether `packages/testing/src/jsdom-polyfills.cjs` gets its own colocated test, matching or not
  matching the convention (or lack of one) for `jest.setup.js` / `jest.setup-global.js` in the same
  directory — check whether those carry tests before deciding.
