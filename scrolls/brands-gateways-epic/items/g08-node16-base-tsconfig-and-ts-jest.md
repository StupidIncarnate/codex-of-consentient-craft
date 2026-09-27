# G08: `node16` in the published base tsconfig; one shared ts-jest options entry

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, items 43 (lines 865-873), 44 (lines 875-882), 45 step 4 (lines 906-909), and the `packageScaffoldConfigStatics` row of item 45's table (line 923) |
| Needs | nothing |
| Unblocks | [G25](g25-consumer-init-end-to-end.md), [T01](t01-msw-everywhere.md) |
| Packages touched | `eslint-plugin` (published base tsconfig), `testing` (published `jest-config-base.js`), `cli` (`packageScaffoldConfigStatics`, `create-package`'s templates), and every workspace package's own `jest.config.*` (root `jest.config.base.js` plus each package's override) |
| Checks to run | `lint,typecheck,unit` across every package whose jest config or tsconfig changes |
| Split | operator splits into two: one agent for the published base tsconfig plus the shared ts-jest options entry (`eslint-plugin`, `testing`, root `jest.config.base.js`); a second wave, 2 to 4 `jest.config.*` files per agent, for the per-package configs that switch to reusing it |
| Runs alone | no, but no other Phase 1 item may edit jest or tsconfig files while this runs (per EPIC.md's own Runs-with note on this item) |

## Why

Two separate but related duplications:

**(43) The published base tsconfig still resolves with node10.**
`packages/eslint-plugin/configs/tsconfig.json`, published as `@dungeonmaster/eslint-plugin/tsconfig`,
sets `module: "commonjs"` and `moduleResolution: "node"`. A consumer only gets `node16` because `init`
writes it into their ROOT tsconfig, which extends this published base. A package tsconfig that extends
the published base DIRECTLY, skipping the root, cannot resolve `#gateway/...` imports at all — node10
resolution ignores the `exports` map entirely.

**(44) The ts-jest inline options are repeated in every package's Jest config.**
`module: 'commonjs'` and `moduleResolution: 'node'` sit in the root `jest.config.base.js`, in roughly a
dozen per-package `jest.config.*` files that override `transform` with their OWN copy of the same inline
options, in the published `@dungeonmaster/testing/jest-config-base`, and in `create-package`'s templates.
A future ts-jest option has to be hand-added to every one of these copies.

**(45 step 4 / the `packageScaffoldConfigStatics` row)** Every check needs to resolve with `node16`. The
root tsconfig already does. The published base tsconfig (43) and ts-jest's inline options (44) still say
`moduleResolution: 'node'`, which ignores `exports` entirely — so a package scaffolded fresh today
(`create-package`) inherits both of these gaps from day one, including a Jest config with no awareness of
the three-key `exports` form (`./*.proxy`, `./*.stub`, `./*`) that G26 defines.

## Current state

Checked 2026-09-26 against the code.

**Published base tsconfig** (`packages/eslint-plugin/configs/tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    ...
  }
}
```
Confirmed: no `customConditions`, no `node16`. This is exactly what item 43 describes.

The REPO'S OWN root `tsconfig.json` (not published — this is what `init` writes into a consumer's root,
and what this repo's own packages extend):
```json
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "customConditions": ["source"],
    ...
  }
}
```
So the WORKING shape already exists in this repo — item 43's fix is to move that shape (or the parts of
it that make sense for a package tsconfig, as opposed to a root workspace tsconfig) into the PUBLISHED
base, so a package tsconfig extending it directly, without a root in between, still resolves `#gateway`.

**ts-jest inline options, checked across every package's `jest.config.*`:** the same two-line block
(`module: 'commonjs', moduleResolution: 'node'`) appears inside a `transform` override in these packages'
own `jest.config.*` (confirmed by grep for `moduleResolution` across every package):
`hooks`, `siegelense`, `mcp` (`.cjs`), `hydration-recipes`, `cli`, `testing`, `session-forensics`,
`eslint-plugin`, `hydration`, `config`, `ward`, `local-eslint`, `tooling`, `orchestrator`. Not present in
`web` (`.cjs`) or `shared` — those two do not override `transform` at all, so they already inherit
whatever the root base sets.

**Why the override exists at all (read directly from the code, not guessed):** it is not ONLY about
restating `module`/`moduleResolution`. Reading `packages/hooks/jest.config.js` in full:
```js
const baseConfig = require('../../jest.config.base.js');
const dungeonmasterTransformers = require('../../packages/testing/ts-jest/transformers.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/../../packages/testing/src/jest.setup.js'],
  transformIgnorePatterns: ['/dist/', '/node_modules/(?!(msw|@mswjs|until-async|outvariant)/)'],
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      {
        tsconfig: { allowJs: true, esModuleInterop: true, skipLibCheck: true, isolatedModules: true, module: 'commonjs', moduleResolution: 'node' },
        astTransformers: { before: dungeonmasterTransformers },
      },
    ],
  },
};
```
The root `jest.config.base.js`'s OWN `transform` (line 33) matches only `'^.+\\.ts$'` — plain `.ts`.
`packageScaffoldConfigStatics`'s own comment (read directly, `packages/cli/src/statics/package-scaffold-
config/package-scaffold-config-statics.ts:119-124`) explains WHY packages that import
`@dungeonmaster/testing` need the wider match: `testing`'s root barrel pulls in `msw`, which ships ESM, and
the base's `.ts`-only regex leaves an un-ignored `.js` file under `node_modules/msw` untransformed, which
throws `SyntaxError: Unexpected token 'export'`. So the WIDENED transform key (`'^.+\\.[jt]s$'`) is a real
requirement for these packages, not accidental duplication — but the INLINE OPTIONS OBJECT inside that
override (`tsconfig: {...}`, `astTransformers: {...}`) is an exact byte-for-byte copy of what the base
already has, just attached to a different regex key. THAT is the duplication item 44 means to remove.

**The root `jest.config.base.js`'s own transform** (lines 33-59, confirmed by reading the file) already
has `isolatedModules: true` alongside `module: 'commonjs'`/`moduleResolution: 'node'` — with a load-bearing
comment explaining `isolatedModules` cannot actually be turned OFF today because the proxy-mock
transformer reads the ts-jest `program` to hoist `jest.mock()` calls, and `isolatedModules: true` removes
that program. This comment is important context for anyone tempted to "simplify" by dropping
`isolatedModules` while deduplicating — don't; it stays exactly as commented.

**The PUBLISHED `@dungeonmaster/testing/jest-config-base.js`** (`packages/testing/jest-config-base.js`,
confirmed by reading it in full) has its OWN separate `transform` entry, matching `'^.+\\.ts$'` only (not
the widened `.[jt]s` form), with the SAME `module: 'commonjs', moduleResolution: 'node'` pair, and this
explanatory comment already in place:
```js
// commonjs/node pinned: a consumer's root tsconfig resolves node16 (that is how
// `#gateway/...` imports resolve for tsc), and ts-jest refuses node16 outside its own
// isolatedModules mode. Jest resolves modules itself, so tests lose nothing.
```
This comment is the answer to this item's own Trap (below): ts-jest's OWN transform inline options are
NOT the same question as the tsconfig's `module`/`moduleResolution` — they stay `commonjs`/`node`
deliberately, because ts-jest cannot use `node16` unless `isolatedModules` is on, and turning that on
breaks the proxy-mock hoister. So item 43's `node16` change applies to the PUBLISHED TSCONFIG (what
`tsc` uses to CHECK a package), not to ts-jest's inline transform options (what ts-jest uses to COMPILE a
test file at run time) — these are two different resolution modes serving two different tools, and item
44's fix must not try to make ts-jest use `node16` too.

**`create-package`'s scaffold templates** (`packages/cli/src/statics/package-scaffold-config/package-
scaffold-config-statics.ts`), confirmed by reading lines 100-196: `jestConfigNode`, `jestConfigNodeIntegration`
and `jestConfigTsx` are three literal JS-source-as-a-string templates, and `jestConfigNodeIntegration` and
`jestConfigTsx` both carry the exact same widened-regex-plus-copied-options shape described above
(`moduleResolution: 'node'` appears at both line 143 and line 179). This is the "row" the source doc's
item 45 table names: a newly scaffolded package inherits the same duplication from day one.

## Work

1. **Published base tsconfig (item 43).** Change `packages/eslint-plugin/configs/tsconfig.json` to:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "node16",
       "moduleResolution": "node16",
       "customConditions": ["source"],
       "lib": ["ES2022"],
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true,
       "allowUnreachableCode": false,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true
     }
   }
   ```
   **Trap to verify, not assume:** `customConditions: ["source"]` in a PUBLISHED consumer base could, in
   principle, resolve one of the CONSUMER's OWN dependencies to a `source` condition entry the dependency
   never ships (most published npm packages have no `source` condition in their `exports` map at all).
   Verify this is safe by checking how conditional `exports` resolution actually falls through: a package
   whose `exports` map has no `source` key for a given subpath is NOT an error — Node/TypeScript's
   conditional-exports algorithm tries each condition in the array in order and falls through to the next
   one that IS present (`import` or `require`) when a given key is absent for that subpath. Confirm this
   against a real installed consumer-style dependency in `node_modules` (pick any ordinary npm package
   already installed, read its `package.json` `exports` map, confirm it has no `source` key, and confirm
   `tsc` still resolves it under this new base). Report the confirmation in CHANGED. If it does NOT fall
   through cleanly for some real case, this is a DECISIONS-worthy blocker — do not ship the base change
   without resolving it, since it would break every consumer's typecheck of their OWN dependencies.
2. **One shared ts-jest options entry (item 44).** In the root `jest.config.base.js`, export the ts-jest
   OPTIONS OBJECT (the `tsconfig: {...}` plus `astTransformers: {...}` pair currently inlined at lines
   37-56) as its own named value — e.g. `module.exports.dungeonmasterTsJestOptions = {...}` alongside the
   existing default export, or a separate small module the base and every package both `require`. Keep
   `isolatedModules: true` and the `module`/`moduleResolution` pinned to `commonjs`/`node` exactly as
   commented — this is NOT part of item 43's `node16` change; ts-jest's inline options and the published
   tsconfig serve different tools and stay different.
   - Update every per-package `jest.config.*` that currently RESTATES the options object (the list in
     Current State) to `require` the shared export instead, keeping only what's genuinely per-package:
     the transform KEY regex (`.ts` vs `.[jt]s` vs `.[jt]sx?`), `transformIgnorePatterns`, `roots`,
     `setupFilesAfterEnv`, `jsx`/`testEnvironment` overrides for JSX packages.
   - Mirror the same extraction in the PUBLISHED `packages/testing/jest-config-base.js`, so a consumer
     package gets the same shared-options benefit `create-package` needs (Work step 3).
3. **`create-package`'s templates (item 45 step 4 / the `packageScaffoldConfigStatics` row).** Update
   `jestConfigNodeIntegration` and `jestConfigTsx` in `packages/cli/src/statics/package-scaffold-config/
   package-scaffold-config-statics.ts` to reference the shared options export from step 2, instead of
   inlining the options object as a literal string a second (and third) time. `jestConfigNode` (the
   plainer template with no widened transform) does not need this change unless it too duplicates the
   options object somewhere — confirmed it does not (it has no `transform` override at all).
4. Typecheck and test every touched package. Because this changes something every package's Jest config
   and every package's typecheck depends on, run the FULL scope this item touches, not just a sample:
   `npm run ward -- -- <every package whose jest.config.* or tsconfig.json changed>`.

## Done when

- [ ] `packages/eslint-plugin/configs/tsconfig.json` sets `module: "node16"`, `moduleResolution:
  "node16"`, `customConditions: ["source"]`.
- [ ] The `customConditions: ["source"]` trap is verified against a real installed dependency's `exports`
  map falling through cleanly to `import`/`require` when it has no `source` condition, and this is
  reported in CHANGED.
- [ ] The ts-jest inline options object is defined once, in the root `jest.config.base.js`, exported for
  reuse, and mirrored in the published `packages/testing/jest-config-base.js`.
- [ ] Every per-package `jest.config.*` that used to restate the options object now reuses the shared
  export, keeping only its genuinely per-package pieces (transform key regex, `transformIgnorePatterns`,
  `roots`, `setupFilesAfterEnv`, JSX-specific overrides).
- [ ] `create-package`'s `jestConfigNodeIntegration` and `jestConfigTsx` templates reference the shared
  export instead of inlining the options object.
- [ ] `isolatedModules: true` and `module: 'commonjs'`/`moduleResolution: 'node'` are UNCHANGED inside
  ts-jest's own inline options — this item's `node16` change applies only to the published TSCONFIG, never
  to ts-jest's transform options.
- [ ] `npm run ward -- -- <every touched package>` (`lint,typecheck,unit`) exits 0.

## Traps

- **Do not try to make ts-jest use `node16`.** The existing comment in `packages/testing/jest-config-
  base.js` already explains why: ts-jest refuses `node16` outside its own `isolatedModules` mode, and
  `isolatedModules: true` breaks the proxy-mock hoister (which needs ts-jest's `program` to hoist
  `jest.mock()` calls). Jest resolves modules itself at run time regardless of what `moduleResolution` ts-
  jest's TYPE CHECKING uses, so nothing is lost by leaving ts-jest's inline options exactly as they are.
- **The widened transform-key regex (`.ts` vs `.[jt]s`) is not part of the duplication to remove** — it is
  a genuine per-package need (matching `.js` files that need transforming, per the `packageScaffoldConfigStatics` comment about `msw`'s ESM). Only the OPTIONS OBJECT attached to that key should be shared, not the key itself.
- Two different files are both called "jest-config-base": the repo-INTERNAL
  `jest.config.base.js` at the repo root (what every workspace package here spreads), and the PUBLISHED
  `packages/testing/jest-config-base.js` (what a real consumer's own `jest.config.js` requires as
  `@dungeonmaster/testing/jest-config-base`). Both need the same options-object extraction, done
  separately, since a consumer never sees the repo-root file.

## Concessions made while executing
