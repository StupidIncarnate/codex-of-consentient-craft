import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { commentBatchSendResultContract } from './comment-batch-send-result-contract';
import type { CommentBatchSendResult } from './comment-batch-send-result-contract';

// Defaults to the 'sent' variant. Pass a full override — e.g.
// CommentBatchSendResultStub({ outcome: 'stale', staleAnchors: [CommentAnchorStub()] }) — to get one
// of the other two variants; the discriminated union parse strips the now-irrelevant default fields.
export const CommentBatchSendResultStub = ({
  ...props
}: StubArgument<CommentBatchSendResult> = {}): CommentBatchSendResult =>
  commentBatchSendResultContract.parse({
    outcome: 'sent',
    chatProcessId: ProcessIdStub(),
    ...props,
  });
