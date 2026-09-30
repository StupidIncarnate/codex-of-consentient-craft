/**
 * PURPOSE: Builds a valid CommentBatchResult for tests
 *
 * USAGE:
 * CommentBatchResultStub();
 * // Returns a valid CommentBatchResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { commentBatchResultContract } from './comment-batch-result-contract';
import type { CommentBatchResult } from './comment-batch-result-contract';

export const CommentBatchResultStub = ({
  ...props
}: StubArgument<CommentBatchResult> = {}): CommentBatchResult =>
  commentBatchResultContract.parse({ chatProcessId: 'sample', message: 'sample', ...props });
