import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentBatchReplyContract } from './comment-batch-reply-contract';
import type { CommentBatchReply } from './comment-batch-reply-contract';

export const CommentBatchReplyStub = ({
  ...props
}: StubArgument<CommentBatchReply> = {}): CommentBatchReply =>
  commentBatchReplyContract.parse({
    chatProcessId: 'proc-12345',
    ...props,
  });
