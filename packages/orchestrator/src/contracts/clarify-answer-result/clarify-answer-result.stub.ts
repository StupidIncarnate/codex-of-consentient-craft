/**
 * PURPOSE: Builds a valid ClarifyAnswerResult for tests
 *
 * USAGE:
 * ClarifyAnswerResultStub();
 * // Returns a valid ClarifyAnswerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { clarifyAnswerResultContract } from './clarify-answer-result-contract';
import type { ClarifyAnswerResult } from './clarify-answer-result-contract';

export const ClarifyAnswerResultStub = ({
  ...props
}: StubArgument<ClarifyAnswerResult> = {}): ClarifyAnswerResult =>
  clarifyAnswerResultContract.parse({ chatProcessId: 'sample', ...props });
