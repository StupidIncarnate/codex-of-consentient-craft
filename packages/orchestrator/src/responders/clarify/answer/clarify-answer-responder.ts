/**
 * PURPOSE: Persists design decisions derived from clarification answers to the quest
 *
 * USAGE:
 * await ClarifyAnswerResponder({ questId, answers, questions });
 * // Transforms structured answers into design decisions and upserts them to the quest
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import type { ClarificationQuestion } from '../../../contracts/clarification-question/clarification-question-contract';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { clarificationAnswersToDesignDecisionsTransformer } from '../../../transformers/clarification-answers-to-design-decisions/clarification-answers-to-design-decisions-transformer';

export const ClarifyAnswerResponder = async ({
  questId,
  answers,
  questions,
}: {
  questId: Quest['id'];
  answers: { header: string; label: string }[];
  questions: ClarificationQuestion[];
}): Promise<void> => {
  const decisions = clarificationAnswersToDesignDecisionsTransformer({ answers, questions });

  if (decisions.length > 0) {
    await questModifyBroker({
      input: modifyQuestInputContract.parse({ questId, designDecisions: decisions }),
    });
  }
};
