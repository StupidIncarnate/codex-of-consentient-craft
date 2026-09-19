/**
 * PURPOSE: Public entry point for this package's test proxies — what a CONSUMER package's own
 * proxy composes when its code reaches a recipe. `@dungeonmaster/siegelense`'s
 * `recipeSeedRunBroker` calls `recipeRunBroker`, so its proxy has to stage the same lane answers
 * the recipes' own proxies stage, and that is only reusable if they are exported.
 *
 * USAGE:
 * import { recipeRunBrokerProxy } from '@dungeonmaster/siegelense-recipes/testing';
 */

export * from './src/brokers/recipe/run/recipe-run-broker.proxy';
export * from './src/brokers/guild-with-three-quests/seed/guild-with-three-quests-seed-broker.proxy';
export * from './src/brokers/session-with-nested-subagent/seed/session-with-nested-subagent-seed-broker.proxy';
export * from './src/adapters/fetch/json/fetch-json-adapter.proxy';
export * from './src/adapters/fs/write-text/fs-write-text-adapter.proxy';
