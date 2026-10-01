# CHG-4: A plan names how each browser test gets its data (plan check 19)

| | |
|---|---|
| Kind | change |
| Status | ready |
| Priority | P3: a planned check, waiting on the siege design |
| Package | orchestrator |
| Found | 2026-09-30, walkthrough exploration; `scrolls/orcha-changes/HANDOFF.md` item 9 |
| Moved from | DEF-214, 2026-09-30. The user filed it as part of the siege re-architecture |

## What to build

Before a quest works, an agent writes a plan, and the orchestrator checks it against numbered rules. Rule 19 says: a task that tests a page in the browser, where that page only works once some data exists (for example a guild with quests), must say how that data is created, normally by naming a recipe such as `guild-with-three-quests`. Without it, each tester invents its own setup, differently each time.

Rule 19 is on paper only. It is named in the rules list and never runs, because code cannot tell whether a page "needs data first". The user decided on 2026-09-30 that it belongs to the siege re-architecture, designed together with CHG-3 (Siege memory storage), not patched on its own.

One cheap design, for that work to weigh: every browser-test task must either name a recipe or state "no data needed", and rule 19 only checks that the plan answered.

## Where to look

- `packages/orchestrator/src/statics/work-plan-validation-check/work-plan-validation-check-statics.ts:7` (rule 19 named as not yet checkable)
- `packages/orchestrator/src/transformers/work-plan-validate/work-plan-validate-transformer.ts:19`, `:509-512` (the comment where it would run)
- `scrolls/orcha-changes/08-plan-validation.md:56` and "Checks 18 and 19 read `quest.flows[].recipes[]`" (the original design; each flow's `recipes[]` entry carries a recipe name and the run id that proved it)
- CHG-3, `siegelense/CHG-3-siege-memory-storage.md`

## History

Moved from DEF-214 on 2026-09-30. The rule was left open on purpose by the story that built plan validation: "inventing that predicate would be inventing a design decision this story does not own."
