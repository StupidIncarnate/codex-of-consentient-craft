import { CommentQueueEntryStub } from '../comment-queue-entry/comment-queue-entry.stub';

import { commentQueueStoredContract } from './comment-queue-stored-contract';
import type { CommentQueueStored } from './comment-queue-stored-contract';

export const CommentQueueStoredStub = ({
  value = [CommentQueueEntryStub()],
}: { value?: unknown[] } = {}): CommentQueueStored => commentQueueStoredContract.parse(value);
