import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { commentBatchResponseContract } from './comment-batch-response-contract';
import type { CommentBatchResponse } from './comment-batch-response-contract';

export const CommentBatchResponseStub = ({
  ...props
}: StubArgument<CommentBatchResponse> = {}): CommentBatchResponse =>
  commentBatchResponseContract.parse({
    chatProcessId: ProcessIdStub(),
    ...props,
  });
