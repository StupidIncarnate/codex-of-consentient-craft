/**
 * PURPOSE: Extends an already-written quest.json with designDecisions and toolingRequirements —
 * fields questHarness.writeQuestFile hardcodes to empty arrays, with no override params — so
 * QuestSpecPanelWidget's read-only DESIGN_DECISIONS_LAYER and CONTRACTS_LAYER lists have content
 * to render in e2e tests
 *
 * USAGE:
 * const specReadonly = questSpecReadonlyHarness();
 * quests.writeQuestFile({ questId, questFolder, questFilePath, status: 'review_design', workItems });
 * specReadonly.seedDesignDecisionsAndTooling({
 *   questFilePath,
 *   designDecisions: [DesignDecisionStub({ id: 'dd-one' }), DesignDecisionStub({ id: 'dd-two' })],
 *   toolingRequirements: [ToolingRequirementStub({ id: 'tool-one' }), ToolingRequirementStub({ id: 'tool-two' })],
 * });
 * // quest.json on disk now carries both arrays; re-navigating (or a fresh mount) renders them
 */
import { readFileSync, writeFileSync } from 'fs';

import type { DesignDecision, ToolingRequirement } from '@dungeonmaster/shared/contracts';

const JSON_INDENT = 2;

export const questSpecReadonlyHarness = (): {
  seedDesignDecisionsAndTooling: (params: {
    questFilePath: string;
    designDecisions: DesignDecision[];
    toolingRequirements: ToolingRequirement[];
  }) => void;
} => {
  const seedDesignDecisionsAndTooling = ({
    questFilePath,
    designDecisions,
    toolingRequirements,
  }: {
    questFilePath: string;
    designDecisions: DesignDecision[];
    toolingRequirements: ToolingRequirement[];
  }): void => {
    const quest = JSON.parse(readFileSync(questFilePath, 'utf8')) as Record<PropertyKey, unknown>;
    quest.designDecisions = designDecisions;
    quest.toolingRequirements = toolingRequirements;
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
  };

  return { seedDesignDecisionsAndTooling };
};
