/**
 * PURPOSE: `recipesSeedRunBroker` calls only real code — three recipe callables, `dmRegistryBroker`,
 * and its own environment-variable save/restore — so every child proxy here is wired only to
 * satisfy `enforce-proxy-child-creation`. There is no I/O boundary to stage: proving a seed's own
 * behaviour (real ids, a real write failure, the env var restored) needs a real target on real
 * disk, which is why this broker's own tests are colocated as `.integration.test.ts` and never call
 * this proxy — the same shape `guild-mid-execution-recipe-broker.integration.test.ts` already uses.
 *
 * USAGE:
 * recipesSeedRunBrokerProxy();
 */
import { dmRegistryBrokerProxy } from '../../dm/registry/dm-registry-broker.proxy';
import { guildMidExecutionRecipeBrokerProxy } from '../../guild-mid-execution/recipe/guild-mid-execution-recipe-broker.proxy';
import { questAdvancesOneStepRecipeBrokerProxy } from '../../quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker.proxy';
import { sessionWithNestedChainRecipeBrokerProxy } from '../../session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker.proxy';

export const recipesSeedRunBrokerProxy = (): Record<PropertyKey, never> => {
  dmRegistryBrokerProxy();
  guildMidExecutionRecipeBrokerProxy();
  questAdvancesOneStepRecipeBrokerProxy();
  sessionWithNestedChainRecipeBrokerProxy();
  return {};
};
