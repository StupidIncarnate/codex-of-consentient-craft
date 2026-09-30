/**
 * PURPOSE: Builds a valid StreamJsonToClarification for tests
 *
 * USAGE:
 * StreamJsonToClarificationStub();
 * // Returns a valid StreamJsonToClarification
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { streamJsonToClarificationContract } from './stream-json-to-clarification-contract';
import type { StreamJsonToClarification } from './stream-json-to-clarification-contract';

export const StreamJsonToClarificationStub = ({
  ...props
}: StubArgument<StreamJsonToClarification> = {}): StreamJsonToClarification =>
  streamJsonToClarificationContract.parse({ questions: [], ...props });
