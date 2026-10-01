# DEF-133: A second `guild-empty` seed still shows the name `Guild 1` twice

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: a repeated display name in seeded data |
| Package | hydration |
| Found | 2026-09-28, walkthrough case SL-079 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

On `inst_8591259dc557490183ee35dc08634557` (booted with `--seed guild-empty`), `run ... --steps '[{"step":"seed","recipe":"guild-empty","as":"g"}, ...]'` (run_19) made a second guild `{"id":"2831c324-...","name":"Guild 1","path":".../guilds-under-test/guild-2","urlSlug":"guild-1"}`. The lane API listed two guilds both named `Guild 1` with `urlSlug` `guild-1`, so `/guild-1/...` could reach only one. The slug is fixed (`guild-1`, `guild-1-2`, ...). The name still repeats: a second `guild-empty` seed shows `Guild 1` twice in the UI.

## What should happen

**Decided by the user, 2026-09-30: generated names are unique per instance.**

The recipe framework (`packages/hydration`) numbers every generated display value across the whole instance, the way DEF-78 made folders and ids unique. A second `guild-empty` seed on one instance makes `Guild 2`, not a second `Guild 1`. Fix it once in the framework, not per recipe, since every recipe in every repo uses it. Find every generated field fed by the per-seed counter (names, titles and the like). Test by seeding each recipe in the catalog twice on one lane and asserting every generated name differs. The real app is unchanged: a person may still create two guilds with one name.

## Where to look

- `packages/hydration/` (the recipe framework counter) and `packages/hydration-recipes/src/` (the `guild-empty` recipe)
- `packages/orchestrator/src/brokers/guild/add/guild-add-broker.ts` (slug suffix logic)

## History

`1a5c895cc`, merge `7a31cf9aa`, ward run `1790721427059-3420`: `guildAddBroker` never checked existing slugs; it now takes the first free `-<n>` suffix for every caller. DEF-78 earlier made folders and ids unique per instance.
