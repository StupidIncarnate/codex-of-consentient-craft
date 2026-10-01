# DEF-271: Dungeonmaster and assayer are pinned to TypeScript 5.8, two majors behind, and ts-jest blocks the upgrade

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | cross-cutting (dungeonmaster and its consumer assayer) |
| Found | 2026-10-01, after assayer's brands-and-gateways epic, decision D7 (assayer `scrolls/brands-gateways-epic/items/z-4.md`) |

## What is wrong

Both repos run TypeScript 5.8.3. The current release is 7.0.2 (`npm view typescript dist-tags`, 2026-10-01).

- **Dungeonmaster** installs `typescript` 5.8.3, `ts-jest` 29.4.0 and `jest` 30.2.0. ts-jest 29.4.0 declares the
  peer range `typescript >=4.3 <6`, so dungeonmaster cannot move to TypeScript 6 or 7 without a ts-jest that
  supports it. Every consumer that takes dungeonmaster's published Jest base inherits the same ceiling.
- **Assayer** analyses code with the TypeScript copy that ts-morph bundles, 5.8.3 (`require('ts-morph').ts`).
  Its D7 decision routes every analysis call and ts-jest's `compiler` option through that one copy, and declares
  `typescript` as a peer `>=4.3 <6` of `@assayer/core` and `@assayer/npm`, matching ts-jest. A consumer on
  TypeScript 6 or 7 gets an npm peer conflict when it installs assayer. Assayer's coverage IDs, resolved imports
  and probe offsets all come from that bundled copy, so its TypeScript version moves only when ts-morph's does.

## What should happen

Plan one upgrade across both repos, because they share the ceiling:

1. Pick the target major (6 or 7). TypeScript 7 is the Go-native compiler, so check that every tool that loads
   TypeScript as a library still can: ts-jest, ts-morph, typescript-eslint, and dungeonmaster's own lint rules.
2. Upgrade dungeonmaster first: `typescript`, `ts-jest` (or its replacement) and typescript-eslint, then fix the
   fallout with ward.
3. Then assayer: move to a ts-morph release that bundles the target TypeScript. Widen the `typescript` peer range
   of `@assayer/core` and `@assayer/npm` to whatever ts-jest then allows. Run assayer's specimen hash check
   (`tmp/p0-5b-hash/run.sh`): any moved hash is an analysis change and must be explained before it lands. Bump
   nothing that changes assayer's analyzer hash without that check.

## Where to look

- Dungeonmaster: the root `package.json` and `packages/testing` (the published Jest base and its ts-jest options).
- Assayer: `packages/core/package.json` and `packages/@gateway/npm/package.json` (the peer ranges),
  `packages/core/bundled-typescript.js`, and `scrolls/brands-gateways-epic/items/z-4.md` (decision D7).
