# DEF-88: `prune --kind log` removes run readings, and `--kind transcript` matches nothing

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-171, SL-173 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Run readings (`runs/*.json`, `runs/*.jsonl`) count as kind `log`. So `prune --kind log` removes them with the logs, and `--kind transcript` matches nothing.

SL-171: `prune --instance inst_206ec260e0074aa9b7ea8724bd2fc1e2 --kind log --older-than 0s --confirm` removed the 3 .log files AND `heartbeat.json`, `network.jsonl`, `runs/run_1.jsonl`, `runs/run_2.jsonl` (the transcripts, which have their own `--kind transcript`) and `runs/run_1.json`, `runs/run_2.json` (the stored readings `results` reads). Only the video and the two screenshots survived. `--kind log` must take .log files only.

SL-173 (the inverse): `prune --instance inst_6c27438b06c24bfaa3e57677e17abaa8 --kind transcript --older-than 0s --confirm` removed nothing although `runs/run_1.jsonl` is present.

The code now does this on purpose. `prune-asset-classify-transformer.ts:38-47` classifies a run's `.jsonl`/`.json` pair as `log`, with the comment that it keeps `--kind transcript` from taking evidence `results` still needs. `prune-assets-list-broker.ts:69-70` says the capture buffers also classify as `log`. `prune-asset-kind-contract.ts:17` is `z.enum(['video', 'shot', 'transcript', 'log'])`.

## What should happen

**Decided by the user, 2026-09-30:** the kinds become `video`, `shot`, `log` and `run`.

| Kind | Removes |
|---|---|
| `video` | `video/*.webm`, unchanged |
| `shot` | screenshots, unchanged |
| `log` | `.log` files only |
| `run` | a run's stored readings and transcript (`runs/run_N.json`, `runs/run_N.jsonl`) and the capture buffers `results` reads (`network.jsonl`, `console.jsonl`), always together, so `results` never reads a half-deleted run |

`transcript` is removed from the kinds: it cannot be deleted apart from its readings without breaking `results`. Update `prune-asset-kind-contract.ts`, the classifier, `prune --help` and the siegelense docs. Every citation refusal (a `VERIFIED` line, an open issue, a `WALKED` line) still applies to the `run` kind. The purpose of the kinds is in `scrolls/seigelense/siegelense-tooling.md`, "Retention: assets outlive their instance, and something must prune them". Decide where `heartbeat.json` belongs while doing this; it is neither a log nor evidence `results` reads.

## Where to look

- `packages/siegelense/src/transformers/prune-asset-classify/prune-asset-classify-transformer.ts:38-47`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.ts:30-75`
- `packages/siegelense/src/contracts/prune-asset-kind/prune-asset-kind-contract.ts:17`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.ts:128`

## History

DEF-88 itself was fixed in `bde2f95cd`, merged `663316076`, built 2026-09-28: `--kind transcript` no longer matches `console.jsonl`, `network.jsonl` or `runs/*`; `--kind video` removes `video/*.webm` (SL-174; freed 135130 bytes); `unresolved` names `open-issue`.
