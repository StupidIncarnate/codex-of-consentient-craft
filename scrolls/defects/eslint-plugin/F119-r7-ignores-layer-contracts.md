# F119: R7 grades neither unbranded leaves in layer contracts nor non-contract files importing a layer

| | |
|---|---|
| Status | ready |
| Package | eslint-plugin |
| Found | R7 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

R7 (`require-object-contract-brands-indexed`) misses two cases:

1. An unbranded leaf inside a `*-layer-contract.ts` file. The syntax rule skips layers, and the layer half checks brand text only.
2. A non-contract file that imports a layer. `contractIndexBuildBroker`'s `nestedInFiles` records contract files only.

No layer file exists yet, so nothing is wrong today.

## What should happen

Close both before C7's layers land.

## Where to look

The R7 rule in `packages/eslint-plugin` and `contractIndexBuildBroker` in `packages/shared`.

## History

Found by R7. The R7 plan is in `scrolls/brands-gateways-epic/items/b12-require-object-contract-brands.md`, section "Plan — R7: `require-object-contract-brands-indexed`". Not re-verified against code on 2026-09-30: no layer file exists to exercise it.
