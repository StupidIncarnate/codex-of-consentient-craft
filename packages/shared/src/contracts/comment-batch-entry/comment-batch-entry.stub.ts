import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentBatchEntryContract } from './comment-batch-entry-contract';
import type { CommentBatchEntry } from './comment-batch-entry-contract';

export const CommentBatchEntryStub = ({
  ...props
}: StubArgument<CommentBatchEntry> = {}): CommentBatchEntry =>
  commentBatchEntryContract.parse({
    flowId: 'login-flow',
    nodeId: 'start',
    text: 'This assertion looks wrong',
    ...props,
  });
