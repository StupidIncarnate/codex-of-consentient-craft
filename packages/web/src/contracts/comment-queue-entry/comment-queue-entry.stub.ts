import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentQueueEntryContract } from './comment-queue-entry-contract';
import type { CommentQueueEntry } from './comment-queue-entry-contract';

export const CommentQueueEntryStub = ({
  ...props
}: StubArgument<CommentQueueEntry> = {}): CommentQueueEntry =>
  commentQueueEntryContract.parse({
    flowId: 'login-flow',
    nodeId: 'login-page',
    text: 'This assertion looks wrong',
    createdAt: '2026-07-01T12:00:00.000Z',
    ...props,
  });
