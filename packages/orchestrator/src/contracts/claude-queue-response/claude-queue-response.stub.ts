import type { StubArgument } from '@dungeonmaster/shared/@types';

import { claudeQueueResponseContract } from './claude-queue-response-contract';
import type { ClaudeQueueResponse } from './claude-queue-response-contract';

export const ClaudeQueueResponseStub = ({
  ...props
}: StubArgument<ClaudeQueueResponse> = {}): ClaudeQueueResponse =>
  claudeQueueResponseContract.parse({
    sessionId: 'sess-stub-001',
    lines: [],
    ...props,
  });
