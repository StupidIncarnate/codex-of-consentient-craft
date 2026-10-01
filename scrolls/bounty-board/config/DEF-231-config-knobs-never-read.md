# DEF-231: three config knobs are defined and validated but nothing reads them

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | config |
| Found | 2026-09, `scrolls/orcha-changes/28-independent.md` section 28b |
| Moved from | `scrolls/orcha-changes/28-independent.md`, 2026-09-30 |

## What is wrong

`.dungeonmaster.json` accepts three settings that no production code or prompt text reads:

| Knob | Defined at | Every other hit |
|---|---|---|
| `orchestration.timeoutMs` | `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts:67` | its own test, `config-defaults-statics.ts:24` |
| `devServer.readinessPath` | same contract, `:126` | `config-defaults-statics.ts:45`, the install responder, tests |
| `devServer.readinessTimeoutMs` | same contract, `:130` | `config-defaults-statics.ts:51`, tests |

A user can set them and nothing happens. Re-checked 2026-09-30 by searching `packages/*/src/**/*.ts`: only contract, defaults, install responder and tests match.

## What should happen

Either wire each knob to the code it claims to control, or remove it from the contract, defaults and install output. Before removing one, search the prompt statics for the name. `devServer.devCommand` looked unread the same way and was not: a prompt (`tavernkeeper-prompt-statics.ts`) tells a session to read it.

## Where to look

- `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts`
- `packages/config/src/statics/config-defaults/config-defaults-statics.ts`
- `packages/config/src/responders/install/create-config/install-create-config-responder.ts`
- `packages/orchestrator/src/statics/*-prompt*/`: search for the three names before deleting
- `environment.harness.ts` (comment already says readiness is "Never read by Start")

## History

Source table and the `devCommand` correction: `scrolls/orcha-changes/28-independent.md`, section 28b.
