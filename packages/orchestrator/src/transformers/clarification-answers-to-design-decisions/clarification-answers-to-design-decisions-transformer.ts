/**
 * PURPOSE: Turns answered clarification questions into DesignDecisions. The title is the answer's summary
 * line; the rationale holds each picked option's description on its own line, then the typed text.
 *
 * USAGE:
 * clarificationAnswersToDesignDecisionsTransformer({ answers: [ClarificationAnswerStub({ header: 'DB', labels: ['PostgreSQL'] })], questions: [ClarificationQuestionStub()] });
 * // Returns DesignDecision[] with id, title, rationale, relatedNodeIds
 */

import { designDecisionContract } from '@dungeonmaster/shared/contracts';

import type { ClarificationAnswer } from '../../contracts/clarification-answer/clarification-answer-contract';
import type { ClarificationQuestion } from '../../contracts/clarification-question/clarification-question-contract';
import type { DesignDecision } from '@dungeonmaster/shared/contracts';
import { clarificationAnswerToLineTransformer } from '../clarification-answer-to-line/clarification-answer-to-line-transformer';

export const clarificationAnswersToDesignDecisionsTransformer = ({
  answers,
  questions,
}: {
  answers: ClarificationAnswer[];
  questions: ClarificationQuestion[];
}): DesignDecision[] => {
  const decisions: DesignDecision[] = [];
  const questionByHeader = new Map(
    questions.map((question) => [question.header.trim().toLowerCase(), question]),
  );

  for (const answer of answers) {
    const matchingQuestion = questionByHeader.get(answer.header.trim().toLowerCase());

    if (!matchingQuestion) continue;

    const descriptionByLabel = new Map(
      matchingQuestion.options.map((opt) => [String(opt.label), String(opt.description)]),
    );

    const labelLines = answer.labels.map((label) => descriptionByLabel.get(label) ?? label);
    const rationale = (answer.text === undefined ? labelLines : [...labelLines, answer.text]).join(
      '\n',
    );

    const kebabHeader = answer.header
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '');

    const id = designDecisionContract.shape.id.parse(`dd-${kebabHeader}`);
    const title = designDecisionContract.shape.title.parse(
      clarificationAnswerToLineTransformer({ answer }),
    );
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
