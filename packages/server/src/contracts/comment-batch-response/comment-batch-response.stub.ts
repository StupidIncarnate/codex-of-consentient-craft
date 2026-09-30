import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentBatchResponseContract } from './comment-batch-response-contract';
import type { CommentBatchResponse } from './comment-batch-response-contract';

// Re-exported so a `.proxy.ts` can hand the real schema to `StartEndpointMock.listen({contract})`
// (T03): @dungeonmaster/enforce-proxy-patterns bans a proxy importing anything from a path ending
// `-contract` (only `.stub` paths are exempt), so the schema reaches a proxy through here.
export { commentBatchResponseContract };

export const CommentBatchResponseStub = ({
  ...props
}: StubArgument<CommentBatchResponse> = {}): CommentBatchResponse =>
  commentBatchResponseContract.parse({
    chatProcessId: 'proc-12345',
    deliveredMessage:
      'Flow "Login Flow" / node `login-page` ("Login Page")\nUser Comment: This copy is wrong',
    ...props,
  });
