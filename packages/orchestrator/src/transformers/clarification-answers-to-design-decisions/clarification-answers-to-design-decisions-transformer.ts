/**
 * PURPOSE: Transforms structured clarification answers and their matching questions into DesignDecision objects
 *
 * USAGE:
 * clarificationAnswersToDesignDecisionsTransformer({ answers: [{header: 'DB', label: 'PostgreSQL'}], questions: [ClarificationQuestionStub()] });
 * // Returns DesignDecision[] with id, title, rationale, relatedNodeIds
 */

import { designDecisionContract } from '@dungeonmaster/shared/contracts';
import { designDecisionIdContract } from '@dungeonmaster/shared/contracts';

import type { ClarificationQuestion } from '../../contracts/clarification-question/clarification-question-contract';
import type { DesignDecision } from '@dungeonmaster/shared/contracts';

export const clarificationAnswersToDesignDecisionsTransformer = ({
  answers,
  questions,
}: {
  answers: { header: string; label: string }[];
  questions: ClarificationQuestion[];
}): DesignDecision[] => {
  const decisions: DesignDecision[] = [];

  for (const answer of answers) {
    const matchingQuestion = questions.find(
      (q) => q.header.trim().toLowerCase() === answer.header.trim().toLowerCase(),
    );

    if (!matchingQuestion) continue;

    const matchingOption = matchingQuestion.options.find((opt) => opt.label === answer.label);

    const rationale = matchingOption ? String(matchingOption.description) : answer.label;

    const kebabHeader = answer.header
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '');

    const id = designDecisionIdContract.parse(`dd-${kebabHeader}`);
    const title = designDecisionContract.shape.title.parse(`${answer.header}: ${answer.label}`);
    const parsedRationale = designDecisionContract.shape.rationale.parse(rationale);

    decisions.push(
      designDecisionContract.parse({
        id,
        title,
        rationale: parsedRationale,
        relatedNodeIds: [],
      }),
    );
  }

  return decisions;
};
