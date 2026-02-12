/**
 * PURPOSE: Builds a continuation context string from a signal's continuation point and the agent's captured output tail
 *
 * USAGE:
 * buildContinuationContextTransformer({ continuationPoint: SignalContinuationPointStub(), capturedOutput: [StreamTextStub()] });
 * // Returns ContinuationContext with continuation point and trimmed agent output, or null if both are empty
 */

import {
  continuationContextContract,
  type ContinuationContext,
} from '../../contracts/continuation-context/continuation-context-contract';
import type { StreamSignal } from '../../contracts/stream-signal/stream-signal-contract';
import type { StreamText } from '../../contracts/stream-text/stream-text-contract';

type SignalContinuationPoint = NonNullable<StreamSignal['continuationPoint']>;

const OUTPUT_TAIL_LINE_COUNT = 50;

export const buildContinuationContextTransformer = ({
  continuationPoint,
  capturedOutput,
}: {
  continuationPoint?: SignalContinuationPoint;
  capturedOutput: readonly StreamText[];
}): ContinuationContext | null => {
  const outputTail = capturedOutput.slice(-OUTPUT_TAIL_LINE_COUNT);

  const hasContinuation = continuationPoint !== undefined;
  const hasOutput = outputTail.length > 0;

  if (!hasContinuation && !hasOutput) {
    return null;
  }

  const outputSection = hasOutput ? `--- Recent agent output ---\n${outputTail.join('\n')}` : null;

  const combined =
    hasContinuation && outputSection !== null
      ? `${continuationPoint}\n\n${outputSection}`
      : hasContinuation
        ? (continuationPoint as unknown as ContinuationContext)
        : continuationContextContract.parse(outputSection);

  return continuationContextContract.parse(combined);
};
