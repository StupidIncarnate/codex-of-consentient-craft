/**
 * PURPOSE: Renders one clarification answer as its summary line. The orchestrator's resume prompt and design-decision
 * title and the web chat echo all call this, so the three never drift apart.
 *
 * USAGE:
 * clarificationAnswerToLineTransformer({ answer });
 * // Returns 'Letters: Alpha, Gamma — prefer Gamma'; a typed-only answer returns 'Letters: my own answer'
 */

import { clarificationAnswerLineStatics } from '../../statics/clarification-answer-line/clarification-answer-line-statics';

export const clarificationAnswerToLineTransformer = ({
  answer,
}: {
  answer: { header: string; labels: readonly string[]; text?: string | undefined };
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
