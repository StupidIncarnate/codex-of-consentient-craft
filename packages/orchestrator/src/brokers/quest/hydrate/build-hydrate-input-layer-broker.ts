/**
 * PURPOSE: Composes a ModifyQuestInput for one transition in the hydrator walk by selecting blueprint fields per the strategy
 *
 * USAGE:
 * const input = buildHydrateInputLayerBroker({ blueprint, toStatus, questId });
 * // Returns: ModifyQuestInput ready for questModifyBroker at this transition
 */

import type { ModifyQuestInput, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';

import type { QuestBlueprint } from '../../../contracts/quest-blueprint/quest-blueprint-contract';
import { questHydrateStrategyStatics } from '../../../statics/quest-hydrate-strategy/quest-hydrate-strategy-statics';
import { flowsStripObservablesTransformer } from '../../../transformers/flows-strip-observables/flows-strip-observables-transformer';

export const buildHydrateInputLayerBroker = ({
  blueprint,
  toStatus,
  questId,
}: {
  blueprint: QuestBlueprint;
  toStatus: QuestStatus;
  questId: QuestId;
}): ModifyQuestInput => {
  const strategyMap = questHydrateStrategyStatics.strategies as Record<
    QuestStatus,
    (typeof questHydrateStrategyStatics.strategies)[keyof typeof questHydrateStrategyStatics.strategies]
  >;
  const strategy = strategyMap[toStatus];

  const basePayload = { questId, status: toStatus } as const;

  if (strategy === null) {
    return modifyQuestInputContract.parse(basePayload);
  }

  const blueprintAdditions = strategy.blueprintFields.reduce<Partial<ModifyQuestInput>>(
    (acc, field) => {
      switch (field) {
        case 'designDecisions':
          return { ...acc, designDecisions: blueprint.designDecisions };
        case 'contracts':
          return { ...acc, contracts: blueprint.contracts };
        case 'toolingRequirements':
          return { ...acc, toolingRequirements: blueprint.toolingRequirements };
        case 'operations':
          return { ...acc, operations: blueprint.operations };
        default:
          return acc;
      }
    },
    {},
  );

  const flowsAdditions: Partial<ModifyQuestInput> = (() => {
    if (strategy.flowsMode === 'no-observables') {
      return { flows: flowsStripObservablesTransformer({ flows: blueprint.flows }) };
    }
    if (strategy.flowsMode === 'full') {
      return { flows: blueprint.flows };
    }
    return {};
  })();

  return modifyQuestInputContract.parse({
    ...basePayload,
    ...blueprintAdditions,
    ...flowsAdditions,
  });
};
