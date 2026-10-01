/**
 * PURPOSE: Renders one clarification answer as its summary line. The resume prompt and the design-decision
 * title both call this, so the two never drift apart.
 *
 * USAGE:
 * clarificationAnswerToLineTransformer({ answer });
 * // Returns 'Letters: Alpha, Gamma — prefer Gamma'; a typed-only answer returns 'Letters: my own answer'
 */

import type { ClarificationAnswer } from '../../contracts/clarification-answer/clarification-answer-contract';
import { clarificationAnswerLineStatics } from '../../statics/clarification-answer-line/clarification-answer-line-statics';

export const clarificationAnswerToLineTransformer = ({
  answer,
}: {
  answer: ClarificationAnswer;
}): string => {
  const { separators } = clarificationAnswerLineStatics;
  const { header, labels, text } = answer;
  const labelsPart = labels.join(separators.labels);

  if (labels.length === 0) {
    return `${header}${separators.header}${text ?? ''}`;
  }
  if (text === undefined) {
    return `${header}${separators.header}${labelsPart}`;
  }
  return `${header}${separators.header}${labelsPart}${separators.text}${text}`;
};
