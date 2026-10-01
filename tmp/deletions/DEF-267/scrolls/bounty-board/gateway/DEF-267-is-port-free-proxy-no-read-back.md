# DEF-267: The `is-port-free` gateway proxy cannot show what it was called with

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | gateway |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

Gateway proxies give callers a read-back (`getCalls` or `getCallsFor`), so a test can assert what the code under test asked for. `is-port-free` has only setups:

`packages/@gateway/node/src/net/is-port-free/is-port-free.proxy.ts:39-42` — `export const isPortFreeProxy = (): { setupPortFree: ... setupPortInUse: ... }`

A test cannot check which port a broker probed.

## What should happen

Add `getCallsFor({ port })` in the same shape as `free-port-pair.proxy.ts`. While there, check the proxies the 2026-09-30 check did not open: the fs read-shaped ones, `lsof`, `kill` and `npm-install`.

## Where to look

- `packages/@gateway/node/src/net/is-port-free/is-port-free.proxy.ts`
- For the shape: `packages/@gateway/node/src/net/free-port-pair/free-port-pair.proxy.ts:35`

## History

Item 28 of the gateway follow-up doc ("proxy addressing and read-back"). Every other gap it listed is closed.
