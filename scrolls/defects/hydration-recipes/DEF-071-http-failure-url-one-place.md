# DEF-71: The "no URL known" transport error is fixed per caller, not in one place

| | |
|---|---|
| Status | ready |
| Package | hydration-recipes |
| Found | 2026-09-27, walkthrough cases SL-056, SL-057, SL-058 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

A recipe's HTTP failure printed `ingredient "quest"'s "api" route failed with no URL known: Error: ...` on a `stack` lane, which has a URL. The error line also printed twice. The decoration was fixed per caller through `dmHttpTransportFailureTransformer`; the one-place fix in the HTTP request wrapper was left. The old adapter is gone; `dm-http-request-broker.ts:50` now builds the URL as `${target.baseUrl}${path}`.

Still pinned on 2026-09-30: `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.integration.test.ts:150` expects the text `failed with no URL known`.

## What should happen

The transport wrapper attaches the URL itself, so no caller has to decorate the failure and "no URL known" cannot appear when a URL exists.

## Where to look

- `packages/hydration-recipes/src/brokers/dm/http-request/dm-http-request-broker.ts:43-50`
- `packages/hydration-recipes/src/transformers/dm-http-transport-failure/dm-http-transport-failure-transformer.ts` (its header says the adapter "never attaches one")
- `packages/hydration-recipes/src/brokers/recipes-seed/run/recipes-seed-run-broker.ts`
Could not confirm whether the duplicate error line is still printed.

## History

`9c02ec288` and `a175d8d61`, built 2026-09-27: the quest `api` route now sends gate content, and all four recipes seed on a live lane. A killed server reports its URL via `dmHttpTransportFailureTransformer`.
