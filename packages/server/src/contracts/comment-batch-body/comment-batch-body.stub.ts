import type { StubArgument } from '@dungeonmaster/shared/@types';
import { CommentBatchEntryStub } from '@dungeonmaster/shared/contracts/comment-batch-entry/comment-batch-entry.stub';

import { commentBatchBodyContract } from './comment-batch-body-contract';
import type { CommentBatchBody } from './comment-batch-body-contract';

export const CommentBatchBodyStub = ({
  ...props
}: StubArgument<CommentBatchBody> = {}): CommentBatchBody =>
  commentBatchBodyContract.parse({
    comments: [CommentBatchEntryStub()],
    ...props,
  });
