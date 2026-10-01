# DEF-93: `status` does not show a stuck reservation

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a stuck reservation is invisible to `status` |
| Package | siegelense |
| Found | 2026-09-28, DEF-68 check |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Registry row `inst_a620d5f3cc1e4431ac7b1b2613d82292` was reserved at 14:01 (`reservedAtMs: 1790542912971`) and never booted (`pid: null`, `pgids: []`, `lastBeatMs: null`), but stayed `state: "alive"`. `status` does not show the row at all. `instanceStateContract` has no `reserving` member (`instance-state-contract.ts:22` is a closed enum), and the header of `status-read-broker.ts:20-23` says so.

## What should happen

`status` shows reservations (a `reserving` state), and a stale reservation does not bypass the `--since` filter. Without a contract change, `status-read-broker.ts` could let a stale reservation bypass the `--since` filter.

## Where to look

- `packages/siegelense/src/contracts/instance-state/instance-state-contract.ts:22`
- `packages/siegelense/src/brokers/status/read/status-read-broker.ts:20-23` and the `--since` filter near `:84`
- `packages/siegelense/src/brokers/instance/state-resolve/instance-state-resolve-broker.ts`

## History

The `capacity` half was fixed in `711da018f`, built: `capacity` excludes a reservation past `reservation.staleAfterMs` (300000, `instance-lifecycle-statics.ts:75`). Post-build check: `capacity` counted the same 2 instances `status` listed. Unit tests cover the exclusion; no stale reservation existed to test live. `cleanup` reaped the original row: `REAPED: inst_a620... (stale 4h, killed none, home removed)`.
