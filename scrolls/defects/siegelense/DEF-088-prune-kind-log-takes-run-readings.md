# DEF-88: `prune --kind log` removes run readings, and `--kind transcript` matches nothing

| | |
|---|---|
| Status | needs decision |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-171, SL-173 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Run readings (`runs/*.json`, `runs/*.jsonl`) count as kind `log`. So `prune --kind log` removes them with the logs, and `--kind transcript` matches nothing.

SL-171: `prune --instance inst_206ec260e0074aa9b7ea8724bd2fc1e2 --kind log --older-than 0s --confirm` removed the 3 .log files AND `heartbeat.json`, `network.jsonl`, `runs/run_1.jsonl`, `runs/run_2.jsonl` (the transcripts, which have their own `--kind transcript`) and `runs/run_1.json`, `runs/run_2.json` (the stored readings `results` reads). Only the video and the two screenshots survived. `--kind log` must take .log files only.

SL-173 (the inverse): `prune --instance inst_6c27438b06c24bfaa3e57677e17abaa8 --kind transcript --older-than 0s --confirm` removed nothing although `runs/run_1.jsonl` is present.

The code now does this on purpose. `prune-asset-classify-transformer.ts:38-47` classifies a run's `.jsonl`/`.json` pair as `log`, with the comment that it keeps `--kind transcript` from taking evidence `results` still needs. `prune-assets-list-broker.ts:69-70` says the capture buffers also classify as `log`. `prune-asset-kind-contract.ts:17` is `z.enum(['video', 'shot', 'transcript', 'log'])`.

## What should happen

The user's original rule: `--kind log` takes .log files only; run readings are removed only by a kind that names them, or by pruning the whole instance. The choice to make: add a separate `run` kind (and change `prune-asset-kind-contract.ts`), or accept that run readings are logs and fix the help so `--kind transcript` is not offered when it can match nothing.

## Where to look

- `packages/siegelense/src/transformers/prune-asset-classify/prune-asset-classify-transformer.ts:38-47`
- `packages/siegelense/src/brokers/prune/assets-list/prune-assets-list-broker.ts:30-75`
- `packages/siegelense/src/contracts/prune-asset-kind/prune-asset-kind-contract.ts:17`
- `packages/siegelense/src/brokers/prune/instance-reclaim/prune-instance-reclaim-broker.ts:128`

## History

DEF-88 itself was fixed in `bde2f95cd`, merged `663316076`, built 2026-09-28: `--kind transcript` no longer matches `console.jsonl`, `network.jsonl` or `runs/*`; `--kind video` removes `video/*.webm` (SL-174; freed 135130 bytes); `unresolved` names `open-issue`.
