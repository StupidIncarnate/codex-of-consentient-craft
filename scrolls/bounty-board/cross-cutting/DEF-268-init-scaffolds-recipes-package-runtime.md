# DEF-268: `init` scaffolds a whole runtime package into `packages/hydration-recipes`, not just a collection of recipes

|         |                                                                             |
|---------|-----------------------------------------------------------------------------|
| Kind    | defect                                                                      |
| Status  | needs decision                                                              |
| Priority | P2: consumers carry runner code they should not own, but it works; waits on a decision |
| Package | cross-cutting (siegelense, hydration-recipes, hydration, eslint-plugin)     |
| Found   | 2026-09-30, the user, looking at a consumer repo after `dungeonmaster init` |

## What is wrong

`dungeonmaster init` writes a full package skeleton into a consumer's `packages/hydration-recipes/`. The user saw these in the consumer tree:

- `src/flows/recipes/recipes-flow.ts` and its integration test
- `src/responders/recipes/listing/` and `src/responders/recipes/seed/`, each with a responder, a proxy and a test
- `src/responders/responders.ts`
- `src/startup/start-hydration-recipes.ts` and its integration test
- `src/index.ts`, `package.json`, `tsconfig.json`, `tsconfig.build.json`, `jest.config.js`

That is the plumbing that lists and runs recipes. It belongs in the hydration tool, not in every repo that holds recipes. A consumer ends up owning, testing and building a copy of dungeonmaster's runner code.

This repo has the same shape. `packages/hydration-recipes/src/` holds flows, responders, startup and runner brokers (`recipes-hydration`, `recipes-listing`, `recipes-seed`, `dm`) next to the actual recipes under `brokers/recipes/`.

## What should happen

The user's rule: in a consumer and in this repo, `packages/hydration-recipes` is just a collection of recipes. The hydration tool pulls the recipes from it. Listing, seeding, the flow and the startup live in the tool, once.

This needs a plan before anyone builds it. Questions the plan must answer:

1. Which package owns the runner: `hydration`, `siegelense`, or a new one?
2. How does the tool find and load a consumer's recipes? Today `recipesLocateBroker` loads the compiled `packages/hydration-recipes/dist/index.js`. Does a recipes-only package still need a build, a `package.json` and a barrel?
3. Where do ingredients live? They are not recipes, but each repo writes its own.
4. What happens to consumers already scaffolded with the full skeleton? Init leaves an existing package untouched today.
5. What `enforce-hydration-recipes-structure` requires afterwards. Today it requires the same five files the scaffold writes.
6. Which agent prompts change. `recipe-maker` and `write-ingredient` name paths inside `packages/hydration-recipes`.

## Where to look

- `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts` — writes the scaffold during `init`
- `packages/siegelense/src/transformers/recipes-scaffold-files/recipes-scaffold-files-transformer.ts:325-377` — the list of files it writes
- `packages/siegelense/src/responders/install/recipes-finalize/install-recipes-finalize-responder.ts` — runs `npm install` and the build for the fresh package
- `packages/siegelense/src/brokers/recipes/locate/recipes-locate-broker.ts` — how siegelense finds the compiled recipes
- `packages/eslint-plugin/src/brokers/rule/enforce-hydration-recipes-structure/` and `packages/eslint-plugin/src/statics/hydration-recipes-structure/`
- `packages/hydration-recipes/src/` — this repo's own copy: `flows/`, `responders/`, `startup/`, and the runner brokers beside `brokers/recipes/`
- `packages/orchestrator/src/statics/recipe-maker/recipe-maker-statics.ts`, `packages/orchestrator/src/statics/write-ingredient/write-ingredient-statics.ts`
- `scripts/consumer-check/` — asserts what `init` writes, so it changes with the plan

## History

Raised by the user on 2026-09-30. No plan written yet.
