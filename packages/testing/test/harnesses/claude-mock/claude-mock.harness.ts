/**
 * PURPOSE: Wraps Claude CLI mock queue helpers with lifecycle hooks for E2E tests
 *
 * USAGE:
 * const claude = claudeMockHarness();
 * // beforeEach: clears queue
 * claude.queueResponse(SimpleTextResponseStub({ text: 'Hello' }));
 */
import {
  queueClaudeResponse,
  clearClaudeQueue,
} from '../../../e2e/web/harness/claude-mock/queue-helpers';

import type { ClaudeResponse } from '../../../e2e/web/harness/claude-mock/types';

export {
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  ResumeResponseStub,
  MultiTurnResponseStubs,
  ClarificationResponseStub,
} from '../../../e2e/web/harness/claude-mock/claude-response-stubs';

export const claudeMockHarness = (): {
  beforeEach: () => void;
  queueResponse: (params: { response: ClaudeResponse }) => void;
  clearQueue: () => void;
} => ({
  beforeEach: (): void => {
    clearClaudeQueue();
  },
  queueResponse: ({ response }: { response: ClaudeResponse }): void => {
    queueClaudeResponse({ response });
  },
  clearQueue: (): void => {
    clearClaudeQueue();
  },
});
