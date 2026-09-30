# DEF-142: `before` init scripts carry over to every later run and cannot be seen or removed

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-092 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`before` init scripts carry over to every later run on the instance, which fits runs being cumulative (the user's point), but they are invisible and cannot be removed. On `inst_e4fc1619fe3d452bb5547f10cac0bd2e`: run_2 installed a `setInterval` wrapper and run_3 a state probe; run_4 (no `before` step) still had both (`{"intervalWrapper":"number","stateProbe":"string"}`). run_5 ran `{"step":"reset","level":"page"}` then `goto /`: both still ran, and the reset reported `{"restored":"page",...,"NOT_cleared":["disk","server memory"]}`, leaving init scripts off the list the attacking docs tell agents to trust.

## What should happen

(1) Every run's reading, and `status --instance`, list the active `before` scripts. (2) `reset level: page` removes them, or `NOT_cleared` names them (for example `"init scripts (2)"`). Playwright cannot remove an init script: the session must keep a list of installed sources and rebuild its context on `reset level page`. A cheap interim not done: a static `init scripts (installed by before)` line in `resetStatics.notCleared.page`.

## Where to look

- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts:525-526` (`addInitScript` passes the source to `page.addInitScript`; `:169`, `:172` install the ref registry and settle scripts)
- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts`
- the reset statics (`resetStatics.notCleared.page`)

## History

Was `queued — contracts/adapters pivot`.
