# DEF-271: Dungeonmaster and assayer are pinned to TypeScript 5.8, two majors behind

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting (dungeonmaster and its consumer assayer) |
| Found | 2026-10-01, after assayer's brands-and-gateways epic, decision D7 (assayer `scrolls/brands-gateways-epic/items/z-4.md`) |

## What is wrong

Both repos run TypeScript 5.8.3. The current release is 7.0.2 (`npm view typescript dist-tags`, 2026-10-01).

- **Dungeonmaster** installs `typescript` 5.8.3, `ts-jest` 29.4.0, `jest` 30.2.0, `@typescript-eslint/parser`
  8.45.0 and `@typescript-eslint/utils` 8.35.1. Every one of those caps TypeScript below 6.
- **Dungeonmaster's published packages cap their consumers too.** `@dungeonmaster/eslint-plugin` and
  `@dungeonmaster/ward` declare the peer `typescript: ^5.0.0`, and `@dungeonmaster/npm` declares `^5.8.3`.
  `packages/cli/src/statics/dev-dependencies/dev-dependencies-statics.ts` installs `typescript ^5.8.3` into every
  consumer that runs `dungeonmaster init`.
- **Assayer** analyses code with the TypeScript copy that ts-morph 26 bundles, 5.8.3 (`require('ts-morph').ts`).
  Its D7 decision routes every analysis call and ts-jest's `compiler` option through that one copy, and declares
  `typescript` as a peer `>=4.3 <6` of `@assayer/core` and `@assayer/npm`. A consumer on TypeScript 6 or 7 gets an
  npm peer conflict when it installs assayer. Assayer's coverage IDs, resolved imports and probe offsets all come
  from that bundled copy, so its TypeScript version moves only when ts-morph's does.

## What should happen

**Target TypeScript 6.0.3, not 7.** Every tool in the chain supports 6 today, and none supports 7:

| Tool | TypeScript it accepts (2026-10-01) |
|---|---|
| ts-jest 29.4.8 and later | `>=4.3 <7` |
| typescript-eslint 8.58 and later | `>=4.8.4 <6.1.0` |
| ts-morph 28.0.0 | bundles 6.0.2 |

TypeScript 7 also drops the classic compiler API. `typescript@7.0.2`'s root export is only `./lib/version.cjs`;
everything else sits under `./unstable/*`. Dungeonmaster calls the classic API (`createSourceFile`,
`createProgram`, `forEachChild`, `resolveModuleName` and so on) from about 60 production files in shared,
testing (the ts-jest AST transformers), cli, tooling, ward and eslint-plugin. Moving to 7 is a rewrite of those
files, and waits until ts-jest, typescript-eslint and ts-morph support it.

### Measured fallout in dungeonmaster

On 2026-10-01, `typescript@6.0.3` was installed outside the repo and every package's `tsconfig.json` was
typechecked with it beside 5.8.3. Every classic API name the repo calls exists in 6.0.3.

| Cause | Errors | Fix |
|---|---|---|
| `types` now defaults to an empty list, so `@types/jest` and `@types/node` stop loading | about 67,000, in every package | Set `types` in the published base `packages/eslint-plugin/configs/tsconfig.json`. With `"types": ["*"]` every package but web and server typechecks clean. `"*"` is TypeScript 6 syntax, so a consumer still on 5.x would break; `["node", "jest"]` should work on both and is untested. |
| The DOM lib types an element's `textContent` as `string`, never null | 52, in 26 `packages/web/src/widgets/**/*.proxy.tsx` files | Type the proxy's return as `string \| null`, not `HTMLElement['textContent']` |
| `Uint8Array<ArrayBufferLike>` no longer assigns to `ArrayBuffer`-backed types | 2: `packages/server/src/flows/images/images-flow.ts:26`, `packages/web/src/widgets/chat-input/chat-input-widget.proxy.tsx:128` | Narrow at each call site |
| A side-effect import with no type declaration is an error | 3, the `.css` imports in `packages/web/src/main.ts` | A `declare module '*.css'` file |
| `moduleResolution: "node"` is deprecated | `packages/web/tsconfig.test.json` | That config already fails on 5.8 (TS5098). Fix it or delete it. |

Every `tsconfig.build.json` sets `rootDir`, so TypeScript 6's new `rootDir` default moves nothing in `dist/`.

**Not yet measured:** typed lint rules under the new typescript-eslint, ts-jest running the custom AST
transformers in `packages/testing/ts-jest/`, and the e2e suite.

### Order of work

1. **Dungeonmaster.** Bump `typescript` to `^6.0.3`, `ts-jest` to `^29.4.14` and `@typescript-eslint/*` to
   `^8.58` or later, in the root and every package that declares them. Widen the published peer ranges, and
   update the consumer dev-dependency statics. Apply the fixes in the table. Run a full `npm run ward`, then
   `npm run build:clean` and `npm run check:consumer`.
2. **Assayer.** Move ts-morph from `^26` to `^28` (two majors, so expect API changes), bump ts-jest, and widen
   the `typescript` peer of `@assayer/core` and `@assayer/npm` to `>=4.3 <7`. Run assayer's specimen hash check
   (`tmp/p0-5b-hash/run.sh`): any moved hash is an analysis change and must be explained before it lands. Bump
   nothing that changes assayer's analyzer hash without that check.

### Running it beside other work

Do it in a worktree from `create-worktree`. Work in the main checkout continues meanwhile; only the merge needs
a pause.

- **Installing in the worktree leaves the main checkout alone.** npm replaces a package directory rather than
  writing through the hardlink. Check it after the install: `node_modules/typescript/package.json` reads 6.0.3 in
  the worktree and 5.8.3 in the main checkout.
- **A worktree is not hermetic.** A module missing from its `node_modules` resolves to the main checkout's copy.
  Confirm the worktree's `tsc --version` (through its npm script) reports 6.0.3 before trusting a green run.
- **At merge, rebase onto `master` and re-run the typecheck.** Code written on `master` meanwhile was checked by
  5.8. The `types` fix covers new tests on its own; new web proxies returning `HTMLElement['textContent']`, new
  `Uint8Array` call sites and new lint hits from the newer typescript-eslint are the mechanical
  fixes to expect. Regenerate `package-lock.json` with `npm install` rather than hand-merging it.
- **After merge, the main checkout needs `npm install` and `npm run build:clean`**, then an MCP reconnect. Pause
  agents in the main checkout for that window: a build rewrites `dist/` with no lock.
- **Other worktrees keep TypeScript 5.8** after the main checkout reinstalls. Their hardlinks still point at the
  old files, because npm swaps in new directories rather than changing the old ones. Re-carve them or run `npm install` in each, and expect the same mechanical
  fixes when their branches merge.

## Where to look

- Dungeonmaster: the root `package.json`, `packages/*/package.json` (peer ranges in eslint-plugin, ward and
  `@gateway/npm`), `packages/eslint-plugin/configs/tsconfig.json` (the published base config),
  `packages/cli/src/statics/dev-dependencies/dev-dependencies-statics.ts`, and `packages/testing/ts-jest/`.
- Assayer: `packages/core/package.json` and `packages/@gateway/npm/package.json` (the peer ranges),
  `packages/core/bundled-typescript.js`, and `scrolls/brands-gateways-epic/items/z-4.md` (decision D7).
