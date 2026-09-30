# DEF-133: A second `guild-empty` seed still shows the name `Guild 1` twice

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | orchestrator |
| Found | 2026-09-28, walkthrough case SL-079 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

On `inst_8591259dc557490183ee35dc08634557` (booted with `--seed guild-empty`), `run ... --steps '[{"step":"seed","recipe":"guild-empty","as":"g"}, ...]'` (run_19) made a second guild `{"id":"2831c324-...","name":"Guild 1","path":".../guilds-under-test/guild-2","urlSlug":"guild-1"}`. The lane API listed two guilds both named `Guild 1` with `urlSlug` `guild-1`, so `/guild-1/...` could reach only one. The slug is fixed (`guild-1`, `guild-1-2`, ...). The name still repeats: a second `guild-empty` seed shows `Guild 1` twice in the UI.

## What should happen

The user said (framework level): every generated field is unique per instance, as folders and slugs now are. The fix commit chose "names may repeat". Decide: keep repeating names, or make the recipe's generated name unique. If unique: find every generated field fed by the recipe counter that restarts at 1 each seed run (names, titles, others), and test by running each recipe in the catalog twice on one lane and asserting every generated field is unique.

## Where to look

- `packages/hydration/` (the recipe framework counter) and `packages/hydration-recipes/src/` (the `guild-empty` recipe)
- `packages/orchestrator/src/brokers/guild/add/guild-add-broker.ts` (slug suffix logic)

## History

`1a5c895cc`, merge `7a31cf9aa`, ward run `1790721427059-3420`: `guildAddBroker` never checked existing slugs; it now takes the first free `-<n>` suffix for every caller. DEF-78 earlier made folders and ids unique per instance.
