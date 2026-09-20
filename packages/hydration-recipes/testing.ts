/**
 * PURPOSE: Public entry point for this package's test proxies — what a CONSUMER package's own
 * proxy composes when its code reaches a recipe.
 *
 * USAGE:
 * import { recipesCatalogBrokerProxy } from '@dungeonmaster/hydration-recipes/testing';
 */

export * from './src/brokers/recipes/guild-empty/recipes-guild-empty-broker.proxy';
export * from './src/brokers/recipes/guild-with-three-quests/recipes-guild-with-three-quests-broker.proxy';
export * from './src/brokers/recipes/guild-mid-execution/recipes-guild-mid-execution-broker.proxy';
export * from './src/brokers/recipes/quest-advances-one-step/recipes-quest-advances-one-step-broker.proxy';
export * from './src/brokers/recipes/quest-completed/recipes-quest-completed-broker.proxy';
export * from './src/brokers/recipes/session-single-turn/recipes-session-single-turn-broker.proxy';
export * from './src/brokers/recipes/session-with-nested-chain/recipes-session-with-nested-chain-broker.proxy';
export * from './src/brokers/recipes/guild-active-suite/recipes-guild-active-suite-broker.proxy';
export * from './src/brokers/recipes/session-with-nested-subagent/recipes-session-with-nested-subagent-broker.proxy';
export * from './src/brokers/recipes/catalog/recipes-catalog-broker.proxy';
export * from './src/adapters/fetch/json/fetch-json-adapter.proxy';
export * from './src/adapters/fs/write-text/fs-write-text-adapter.proxy';
export * from './src/responders/recipes/listing/recipes-listing-responder.proxy';
export * from './src/responders/recipes/seed/recipes-seed-responder.proxy';
