import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sessionResultTextLineContract } from './session-result-text-line-contract';
import type { SessionResultTextLine } from './session-result-text-line-contract';

export const SessionResultTextLineStub = ({
  ...props
}: StubArgument<SessionResultTextLine> = {}): SessionResultTextLine =>
  sessionResultTextLineContract.parse({
    type: 'result',
    result: 'Work recorded and signalled.',
    ...props,
  });
