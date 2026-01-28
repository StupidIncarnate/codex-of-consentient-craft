/**
 * PURPOSE: Stub factory for SignalQuestion branded type
 *
 * USAGE:
 * const question = SignalQuestionStub();
 * // Returns: 'What authentication method would you like to use?'
 */

import { signalQuestionContract } from './signal-question-contract';
import type { SignalQuestion } from './signal-question-contract';

export const SignalQuestionStub = (
  { value }: { value: string } = { value: 'What authentication method would you like to use?' },
): SignalQuestion => signalQuestionContract.parse(value);
