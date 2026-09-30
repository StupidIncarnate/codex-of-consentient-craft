/**
 * PURPOSE: Builds a valid CommentBatchResponderResult for tests
 *
 * USAGE:
 * CommentBatchResponderResultStub();
 * // Returns a valid CommentBatchResponderResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentBatchResponderResultContract } from './comment-batch-responder-result-contract';
import type { CommentBatchResponderResult } from './comment-batch-responder-result-contract';

export const CommentBatchResponderResultStub = ({
  ...props
}: StubArgument<CommentBatchResponderResult> = {}): CommentBatchResponderResult =>
  commentBatchResponderResultContract.parse({ comments: [], flows: [], ...props });
