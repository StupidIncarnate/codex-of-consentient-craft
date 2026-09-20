/**
 * PURPOSE: Public entry point for this package's test proxies — what a CONSUMER package's own
 * proxy composes when its code reaches a recipe. `@dungeonmaster/siegelense`'s
 * `recipeSeedRunBroker` calls `recipeRunBroker`, so its proxy has to stage the same lane answers
 * the recipes' own proxies stage, and that is only reusable if they are exported.
 *
 * USAGE:
 * import { recipeRunBrokerProxy } from '@dungeonmaster/hydration-recipes/testing';
 */

export * from './src/brokers/recipe/run/recipe-run-broker.proxy';
export * from './src/brokers/recipes/guild-with-three-quests/recipes-guild-with-three-quests-broker.proxy';
export * from './src/brokers/recipes/session-with-nested-subagent/recipes-session-with-nested-subagent-broker.proxy';
export * from './src/brokers/recipes/catalog/recipes-catalog-broker.proxy';
export * from './src/adapters/fetch/json/fetch-json-adapter.proxy';
export * from './src/adapters/fs/write-text/fs-write-text-adapter.proxy';
