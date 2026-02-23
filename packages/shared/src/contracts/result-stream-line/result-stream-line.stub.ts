import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resultStreamLineContract } from './result-stream-line-contract';
import type { ResultStreamLine } from './result-stream-line-contract';

export const ResultStreamLineStub = ({
  ...props
}: StubArgument<ResultStreamLine> = {}): ResultStreamLine =>
  resultStreamLineContract.parse({
    type: 'result',
    session_id: 'session-123',
    cost_usd: 0.003,
    duration_ms: 1500,
    num_turns: 3,
    ...props,
  });
