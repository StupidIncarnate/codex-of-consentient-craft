# G09: Tool tests use the current gateway layout as sample data

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 42, lines 855-863 |
| Needs | nothing |
| Unblocks | nothing named in EPIC.md's table |
| Packages touched | `testing`, `eslint-plugin` |
| Checks to run | `unit` |
| Split | one agent |
| Runs alone | no |

## Why

Several tests build FIXTURE data — a fake package map, a fake import specifier — that models the gateway's
OLD layout: an `index.ts` barrel per subpath and per `_test_` folder, instead of today's `{subpath}.ts`
barrel form. Each fixture is self-consistent, so the tests still prove whatever resolver or rule they
test — nothing is actually broken. But a reader who copies one of these fixtures as a starting point for
new test data gets a layout that no longer exists anywhere in the real gateway.

## Current state

Checked 2026-09-26 against the code, by searching for the specific OLD-layout string forms
(`_test_/index.ts`, `src/*/index.ts`, `./src/_test_/index`) across `packages/testing/src` and
`packages/eslint-plugin/src`:

**`packages/testing/src`** — six files hold the old form:
- `packages/testing/src/middleware/workspace-package-import-resolve/workspace-package-import-resolve-middleware.proxy.ts`
- `packages/testing/src/middleware/workspace-package-import-resolve/workspace-package-import-resolve-middleware.test.ts`
- `packages/testing/src/middleware/package-imports-specifier-resolve/package-imports-specifier-resolve-middleware.proxy.ts`
- `packages/testing/src/middleware/package-imports-specifier-resolve/package-imports-specifier-resolve-middleware.test.ts`
- `packages/testing/src/middleware/import-path-resolver/import-path-resolver-middleware.test.ts`
- `packages/testing/src/transformers/workspace-package-export-source/workspace-package-export-source-transformer.test.ts`

One concrete example, read directly from
`workspace-package-import-resolve-middleware.test.ts`:
```ts
it('VALID: {@dungeonmaster/bin/testing, "./*" -> "./src/*/index.ts"} => returns the resolved index path', () => {
  ...
  exports: { './*': { source: './src/*/index.ts' } },
  ...
  exports: { './_test_': { source: './src/_test_/index.ts' } },
  ...
  proxy.setupSourceFileExists({ filePath: '/repo/packages/@gateway/npm/src/_test_/index.ts' });
```

**`packages/eslint-plugin/src`** — a broader search (for any `src/*/index`, `_test_/index`, or
`@gateway/.../index.ts` pattern) found the same old-layout style in these rule test files:
- `packages/eslint-plugin/src/brokers/rule/no-bare-process-cwd/rule-no-bare-process-cwd-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/raw-import-ban/rule-raw-import-ban-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/is-inside-gateway-layer-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/gateway-import-boundary/rule-gateway-import-boundary-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/require-contract-validation/rule-require-contract-validation-broker.test.ts`

Not individually read line-by-line in this pass beyond the one example above; the executing agent reads
each file's fixture before rewriting it, since some may use the old form only in an unrelated part of a
larger fixture and some may use it throughout.

The CURRENT real layout (for comparison, confirmed by reading a real gateway `package.json` earlier in
this epic's own research, and per G26's per-file rule): `exports` holds exactly three keys — `./*.proxy`
(pointing at `./src/*.proxy.ts`), `./*.stub` (pointing at `./src/*.stub.ts`), and `./*` (the barrel key,
pointing at `./src/*/*.ts`, e.g. `./src/fs/fs.ts`, not `./src/fs/index.ts`) — never a root `.` entry and
never a `_test_` key. A stub or proxy is imported from its own file, e.g.
`#gateway/npm/glob/glob/glob.proxy`, not through any barrel.

## Work

1. For each of the eleven files above, rewrite every fixture's `exports` shape from the old
   `{'./*': {source: './src/*/index.ts'}, './_test_': {source: './src/_test_/index.ts'}}` form to the
   current, per-file form: `{'./*.proxy': {source: './src/*.proxy.ts'}, './*.stub': {source:
   './src/*.stub.ts'}, './*': {source: './src/*/*.ts'}}` (or whatever exact shape the CURRENT real gateway
   `package.json` uses for these three entries — re-confirm against a real one, such as
   `packages/@gateway/node/package.json`, rather than trusting this item's own paraphrase, since the exact
   glob form matters to the resolver these tests exercise).
2. Rewrite every accompanying fake FILE PATH the fixture stages against that shape (e.g.
   `/repo/packages/@gateway/npm/src/_test_/index.ts` becomes whatever real per-file proxy or stub path the
   new `exports` keys would actually resolve to for that same subpath, such as
   `/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts` — match the CURRENT real wrapper-folder
   naming convention, not a guess, and drop the fake `_test_` folder entirely).
3. Confirm every test file's ASSERTIONS still describe the SAME resolver or rule BEHAVIOUR as before —
   this item does not change what is being tested, only the sample data used to test it. A test that
   passed before this change must still pass after, proving the same thing, just against current-layout
   data.
4. Run each touched test file to confirm it still passes with the updated fixture.

## Done when

- [ ] None of the eleven files listed in Current State contains the old `index.ts`-barrel fixture form.
- [ ] Each rewritten fixture matches the CURRENT real gateway `package.json` `exports` shape, confirmed
  against a real gateway package file, not assumed.
- [ ] Every touched test still passes, and still tests the same behaviour it tested before (confirmed by
  reading each test's assertions, not just its fixture).
- [ ] `npm run ward -- --only unit -- <the eleven files>` exits 0.

## Traps

- Don't change what a test is proving while fixing its fixture — this item is data hygiene, not a
  behaviour change. If a test's assertion genuinely can no longer be phrased against current-layout data
  (unlikely, but possible), report that under LEFT STANDING rather than silently altering the test's
  intent.
- The eslint-plugin list above was found by a broader pattern match than the testing-package list (which
  used the exact `_test_/index.ts` / `src/*/index.ts` strings) — re-confirm each eslint-plugin file
  actually contains an OLD-layout fixture before editing it; the broader search may have caught files that
  merely mention `@gateway` and `index.ts` in unrelated contexts.

## Concessions made while executing
