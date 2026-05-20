/**
 * PURPOSE: Converts AskUserQuestion tool_input and tool_response answers into DesignDecision entries
 *
 * USAGE:
 * askQuestionToDesignDecisionsTransformer({ toolInput, answers, nowMs: Date.now() });
 * // Returns DesignDecision[] — one per answered question, with id timestamped to avoid collisions
 *
 * WHEN-TO-USE: Inside the post-ask-question hook responder after verifying tool_name === 'AskUserQuestion'
 * WHEN-NOT-TO-USE: When tool_response is missing or tool_name is not AskUserQuestion
 */

import {
  designDecisionContract,
  type DesignDecision,
  type AskUserQuestionResponse,
} from '@dungeonmaster/shared/contracts';
import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';

export const askQuestionToDesignDecisionsTransformer = ({
  toolInput,
  answers,
  nowMs,
}: {
  toolInput: unknown;
  answers: AskUserQuestionResponse['answers'];
  nowMs: number;
}): DesignDecision[] => {
  const parsed = askUserQuestionContract.safeParse(toolInput);
  if (!parsed.success) return [];

  return parsed.data.questions
    .map((item) => {
      const questionText = String(item.question);
      const headerText = String(item.header);
      const idSource = headerText.length > 0 ? headerText : questionText;
      const answer = answers[item.question];
      if (answer === undefined) return null;

      const rationale = Array.isArray(answer) ? answer.map(String).join(', ') : String(answer);

      const rawId = idSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-+|-+$/gu, '');

      return designDecisionContract.parse({
        id: `${rawId}-${String(nowMs)}`,
        title: questionText,
        rationale,
        relatedNodeIds: [],
      });
    })
    .filter((d): d is DesignDecision => d !== null);
};
