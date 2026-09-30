import { questCommentBatchResponseDataContract } from './quest-comment-batch-response-data-contract';
import type { QuestCommentBatchResponseData } from './quest-comment-batch-response-data-contract';

export const QuestCommentBatchResponseDataStub = (): QuestCommentBatchResponseData =>
  questCommentBatchResponseDataContract.parse({
    chatProcessId: 'proc-12345',
    deliveredMessage: 'User Comment: This copy is wrong',
  });
