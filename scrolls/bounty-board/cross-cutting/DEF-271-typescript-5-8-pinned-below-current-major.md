# DEF-271: Dungeonmaster and assayer are pinned to TypeScript 5.8, two majors behind

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting (dungeonmaster and its consumer assayer) |
| Found | 2026-10-01, after assayer's brands-and-gateways epic, decision D7 (assayer `scrolls/brands-gateways-epic/items/z-4.md`) |

## What is wrong

Both repos run TypeScript 5.8.3. The current release is 7.0.2 (`npm view typescript dist-tags`, 2026-10-01).
Dungeonmaster's installed ts-jest 29.4.0 and typescript-eslint 8.35/8.45 cap TypeScript below 6, its published
packages declare `typescript` peers of `^5.0.0` / `^5.8.3`, and `dev-dependencies-statics.ts` installs `^5.8.3`
into every consumer. Assayer analyses with the TypeScript ts-morph 26 bundles (5.8.3) and declares the peer
`>=4.3 <6`.

## What should happen

**Target TypeScript 6.0.3, not 7.** TypeScript 7's package root exports only `./lib/version.cjs`; the classic
compiler API dungeonmaster calls from about 60 production files is gone, and ts-jest, typescript-eslint and
ts-morph do not support 7 yet.

| Tool | Version taken | Why that one |
|---|---|---|
| ts-jest | `^29.4.14` | 29.4.8 is the first to accept TypeScript `<7` |
| typescript-eslint | `~8.58.2` | 8.58 is the first to accept TypeScript 6. 8.59 widened `no-unnecessary-type-assertion`'s receiver check, and its `--fix` rewrote 163 files and broke the typecheck where removing a cast changed generic inference (`registry-create-broker.ts`). Moving past 8.58 is its own change. |
| ts-morph (assayer) | `^28.0.0` | bundles TypeScript 6.0.2; its only breaking change is that version |

## Done on branch `ts6-upgrade` (dungeonmaster)

Measured on that branch, run `1790891747883-f463`: lint, typecheck, unit, integration and e2e all pass across
every package. Ward still exits 1 on its slow-test gate, which six `packages/cli` npm-sync and npm-module tests
trip on `master` too (run `1790894385548-1c70`) — not this change.

What TypeScript 6 broke, and the fix each got:

| Break | Fix |
|---|---|
| `types` defaults to an empty list, so no `@types` package loads | root `tsconfig.json` sets `"types": ["*"]`; the published base `packages/eslint-plugin/configs/tsconfig.json` sets `["node", "jest"]`, which a consumer still on 5 can read |
| The DOM lib types an element's `textContent` as `string` | 27 web proxies type it as `Node['textContent']`, which is still `string \| null`; the now-dead `?? ''`, `?.` and `String()` around it are gone |
| `Uint8Array<ArrayBufferLike>` is no longer an `ArrayBuffer`-backed body | `images-flow.ts` copies the bytes; two web proxies take `Uint8Array<ArrayBuffer>` |
| A side-effect import needs a declaration | `packages/web/src/css-imports.d.ts` |
| ts-jest refuses `web/tsconfig.test.json` (TS5011 `rootDir`, deprecated `moduleResolution: "node"`) | `rootDir: "../.."`, `moduleResolution: "bundler"` |
| The npm-sync copy compile loads no `@types/node`, so every wrapper reaching `node:stream` fell back to a passthrough | `copy-compile-layer-broker.ts` template options set `types: ['*']` |
| `ImportClause.isTypeOnly` is deprecated for `phaseModifier`, which 5.x does not have | `isTypeOnlyImportClauseGuard` in shared reads either; the four call sites use it |
| Lint fallout of typescript-eslint 8.58 | `prefer-optional-chain` rewrites, two `AST_NODE_TYPES` statics, `ReturnStatement`-typed `checkAnyLeakReturnLayerBroker`, `RuleContextStub` filling its deprecated fields without reading them |

Not yet run on the branch: `npm run build:clean` then `npm run check:consumer`.

## In progress on branch `ts6-upgrade` (assayer)

Builds clean. The specimen hash check (run in isolated copies, `tmp/ts6-hash/run.sh` on that branch) matches all
351 hashes against TypeScript 5.8 once consumer-rooted ts-morph projects default `types` to `['*']`
(`consumerProjectStatics`). `smoke-repo/packages/syntax-repository/tsconfig.json` sets `"ignoreDeprecations": "6.0"`
so the fixture stays the consumer it was.

Open: TypeScript 6's default lib declares `Map` and `Set`, so the hermetic walk enumerates a `Map<string, number>`
parameter that 5.8 left opaque (`input-gap / map-param` smoke test). The decision is to follow the consumer's own
TypeScript major: opaque for a consumer on 5, enumerated for one on 6.

`typecheck:syntax` fails on assayer `master` with TypeScript 5.8 too (678 errors, `@assayer/shared/transformers`
unresolved under `moduleResolution: "node"`); it is not this change.

## Merging

Main checkouts keep TypeScript 5.8 until each branch merges. Assayer's `@dungeonmaster/*` links point at
dungeonmaster's main checkout, so merging dungeonmaster switches assayer's lint and test tooling to TypeScript 6
at once — merge assayer's branch right after. After each merge: rebase, `npm install`, re-run lint `--fix` and
typecheck for code written meanwhile, then `npm run build:clean` and reconnect the MCP, with agents in that
checkout paused for the build.

## Where to look

- Dungeonmaster: the root `package.json`, `packages/*/package.json`, `packages/eslint-plugin/configs/tsconfig.json`,
  `packages/cli/src/statics/dev-dependencies/dev-dependencies-statics.ts`, `packages/testing/ts-jest/`.
- Assayer: `packages/core/package.json`, `packages/@gateway/npm/package.json`,
  `packages/core/src/statics/consumer-project/`, `packages/core/src/transformers/hermetic-source-file/`.
